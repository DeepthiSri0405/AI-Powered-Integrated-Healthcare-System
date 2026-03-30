import random
import string

def generate_medical_id() -> str:
    """Generate a unique 6-digit medical ID for a citizen"""
    return ''.join(random.choices(string.digits, k=6))

def generate_employee_id() -> str:
    """Generate a unique 6-digit employee ID for hospital staff"""
    return ''.join(random.choices(string.digits, k=6))
