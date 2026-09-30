import os
import re

files = [
    'app/invoices/[id]/page.tsx',
    'app/invoices/page.tsx',
    'app/payments/verify/page.tsx',
    'app/my-bills/page.tsx'
]

for f in files:
    if os.path.exists(f):
        with open(f, 'r', encoding='utf-8') as file:
            content = file.read()
        
        content = re.sub(r",\s*role:\s*'[^']+'", '', content)
        content = re.sub(r",\s*themePreference:\s*'[^']+'", '', content)
        content = re.sub(r",\s*isActive:\s*(true|false)", '', content)
        content = re.sub(r",\s*createdAt:\s*'[^']*'", '', content)
        content = re.sub(r",\s*ownerId:\s*'[^']+'", '', content)
        
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print(f"Fixed {f}")
