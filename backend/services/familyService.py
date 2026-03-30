from config.db import get_database
from bson import ObjectId
from datetime import datetime

async def get_user_family_details(medical_id: str):
    db = get_database()
    member = await db["family_members"].find_one({"user_id": medical_id, "status": {"$in": ["active", "restricted"]}})
    if not member:
        return None
        
    family = await db["families"].find_one({"_id": ObjectId(member["family_id"])})
    if not family:
        return None
        
    family_id = str(family["_id"])
    
    # Fetch all members of this family
    all_members = await db["family_members"].find({"family_id": family_id, "status": {"$in": ["active", "restricted"]}}).to_list(100)
    
    enriched_members = []
    for m in all_members:
        u = await db["users"].find_one({"medicalId": m["user_id"]}, {"name": 1, "age": 1, "is_adult": 1, "autonomy_enabled": 1})
        if u:
            m["name"] = u.get("name")
            m["age"] = u.get("age", 0)
            m["is_adult"] = u.get("is_adult", False)
            m["autonomy_enabled"] = u.get("autonomy_enabled", False)
            m["id"] = str(m["_id"])
            del m["_id"]
            enriched_members.append(m)
            
    return {
        "family_id": family_id,
        "name": family.get("name"),
        "members": enriched_members,
        "my_role": member.get("role")
    }

async def process_leave_family(medical_id: str):
    db = get_database()
    # 1. Update user autonomy flag
    await db["users"].update_one(
        {"medicalId": medical_id}, 
        {"$set": {"autonomy_enabled": True}}
    )
    
    # 2. Set status to "removed" in family_members
    await db["family_members"].update_many(
        {"user_id": medical_id, "status": "active"},
        {"$set": {"status": "removed"}}
    )
    
    # 3. Revoke all parent edit access
    await db["access_controls"].update_many(
        {"owner_user_id": medical_id},
        {"$set": {"is_revoked": True}}
    )
    
    return {"message": "You have successfully gained full independence and left your family group."}

async def process_restrict_access(medical_id: str):
    db = get_database()
    # 1. Enable autonomy flag
    await db["users"].update_one(
        {"medicalId": medical_id}, 
        {"$set": {"autonomy_enabled": True}}
    )
    
    # 2. Change member status to "restricted"
    await db["family_members"].update_many(
        {"user_id": medical_id, "status": "active"},
        {"$set": {"status": "restricted"}}
    )
    
    # 3. Downgrade access to view-only
    await db["access_controls"].update_many(
        {"owner_user_id": medical_id, "is_revoked": False},
        {"$set": {"permission_type": "view"}}
    )
    
    return {"message": "Soft Exit activated. Parents now have View-Only access to your records."}

async def add_new_dependent(admin_medical_id: str, name: str, dob: str, relationship: str):
    import uuid
    db = get_database()
    
    # Find existing family
    admin_member = await db["family_members"].find_one({"user_id": admin_medical_id, "status": "active"})
    if admin_member:
        family_id = admin_member["family_id"]
    else:
        # Create a new family root
        admin_user = await db["users"].find_one({"medicalId": admin_medical_id})
        family_name = f"The {admin_user.get('name', 'Family').split()[-1]} Family"
        family_res = await db["families"].insert_one({"name": family_name, "created_at": datetime.utcnow()})
        family_id = str(family_res.inserted_id)
        await db["family_members"].insert_one({
            "family_id": family_id,
            "user_id": admin_medical_id,
            "role": "Admin",
            "relationship": "Root Guardian",
            "status": "active",
            "joined_at": datetime.utcnow()
        })
        
    dep_medical_id = f"DEP{str(uuid.uuid4().hex)[:6].upper()}"
    
    try:
        birth_year = int(dob.split('-')[0])
        age = datetime.utcnow().year - birth_year
    except:
        age = 0
        
    await db["users"].insert_one({
        "name": name,
        "dob": dob,
        "role": "Citizen",
        "medicalId": dep_medical_id,
        "age": age,
        "is_adult": age >= 18,
        "autonomy_enabled": False,
        "created_at": datetime.utcnow()
    })
    
    await db["family_members"].insert_one({
        "family_id": family_id,
        "user_id": dep_medical_id,
        "role": "Dependent",
        "relationship": relationship,
        "status": "active",
        "joined_at": datetime.utcnow()
    })
    
    await db["access_controls"].insert_one({
        "owner_user_id": dep_medical_id,
        "access_user_id": admin_medical_id,
        "permission_type": "edit",
        "is_revoked": False,
        "created_at": datetime.utcnow()
    })
    
    return {"message": "Verified. Dependent linked to Family Hub.", "dependentId": dep_medical_id}
