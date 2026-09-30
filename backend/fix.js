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
  if (c.includes('Role')) {
    c = c.replace(/Role\.OWNER/g, "'OWNER'")
         .replace(/Role\.ADMIN/g, "'ADMIN'")
         .replace(/Role\.SUPER_ADMIN/g, "'SUPER_ADMIN'")
         .replace(/Role\.TENANT/g, "'TENANT'")
         .replace(/import\s+\{[^}]*Role[^}]*\}\s+from\s+'@prisma\/client';?/g, '');
    fs.writeFileSync(f, c);
    console.log('Fixed', f);
  }
});
