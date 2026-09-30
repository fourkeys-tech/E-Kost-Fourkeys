const fs = require('fs');
const path = require('path');
function walk(d) {
  let r = [];
  fs.readdirSync(d).forEach(f => {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) r = r.concat(walk(p));
    else if (p.endsWith('.ts')) r.push(p);
  });
  return r;
}
walk('./src').forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let changed = false;
  
  if (c.match(/z\.nativeEnum\([^)]+\)/)) {
    c = c.replace(/z\.nativeEnum\([^)]+\)/g, 'z.string()');
    changed = true;
  }
  
  // replace remaining enum values e.g. RoomStatus.EMPTY -> 'EMPTY'
  const enums = ['RoomStatus', 'InvoiceStatus', 'PaymentMethod', 'PaymentStatus', 'NotificationChannel', 'NotificationType', 'Role'];
  enums.forEach(e => {
    const regex = new RegExp(e + '\\.([A-Z_]+)', 'g');
    if (c.match(regex)) {
      c = c.replace(regex, "'$1'");
      changed = true;
    }
  });

  // remove imports from @prisma/client for these enums
  enums.forEach(e => {
    const regex = new RegExp(`import\\s*\\{[^}]*${e}[^}]*\\}\\s*from\\s*'@prisma/client';?`, 'g');
    if (c.match(regex)) {
      // just remove the enum from the import list if possible, or remove the whole import if it's the only one.
      // it's easier to just remove the whole line if it only imports enums.
    }
  });
  
  // A blunt approach to remove Prisma enum imports:
  // We can just replace the specific enum names in the import block with empty string.
  enums.forEach(e => {
    c = c.replace(new RegExp(`\\b${e}\\b\\s*,?`, 'g'), '');
  });
  
  // clean up empty imports `import {  } from '@prisma/client'`
  c = c.replace(/import\s*\{\s*\}\s*from\s*'@prisma\/client';?/g, '');

  if (changed) {
    fs.writeFileSync(f, c);
    console.log('Fixed', f);
  }
});
