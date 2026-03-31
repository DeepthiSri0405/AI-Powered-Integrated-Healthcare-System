import asyncio, sys, os
sys.path.append(os.getcwd())
from config.db import get_database

async def run():
    db = get_database()
    
    # 1. Purge stray admissions that corrupt the new beds
    print('Deleting all existing admissions...')
    await db['admissions'].delete_many({})
    
    print('Resetting beds in ward_rooms...')
    wards = await db['ward_rooms'].find({}).to_list(100)
    for w in wards:
        beds = w.get('beds', [])
        for b in beds:
            b['status'] = 'Empty'
            b['patientId'] = None
        # Make sure to use literal dict and not a variable that somehow isn't proper dict
        await db['ward_rooms'].update_one(
            {'_id': w['_id']},
            {'$set': {'beds': beds}}
        )
        
    await db['users'].update_many({}, {'$set': {'isAdmitted': False, 'currentWardId': None}})
    
    # 2. Family Role Swap for CIT555
    print('Flipping Family details...')
    await db['family_members'].update_many(
        {'user_id': 'CIT555'},
        {'$set': {'role': 'Admin', 'relationship': 'Head / Self'}}
    )
    await db['family_members'].update_many(
        {'user_id': 'CIT444'},
        {'$set': {'role': 'Dependent', 'relationship': 'Mother'}}
    )

    # 3. Remove fake active ward alerts
    print('Purging dummy ward alerts...')
    await db['alerts'].delete_many({})
    
    # 4. Check insurance claim collection
    try:
        await db.create_collection('insurance_claims')
        print('Created insurance_claims collection explicitly')
    except Exception as e:
        print('insurance_claims already exists:', e)
        
    print('Done with fixes!')

if __name__ == '__main__':
    asyncio.run(run())
