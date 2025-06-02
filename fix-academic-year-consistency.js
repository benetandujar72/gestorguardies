const fs = require('fs');

// Llegir el fitxer routes.ts
let content = fs.readFileSync('server/routes.ts', 'utf8');

// Patrons a reemplaçar
const patterns = [
  {
    old: /const activeYear = await storage\.getAnysAcademics\(\)\.then\(years => \s*years\.find\(y => y\.actiu\)\s*\);/g,
    new: 'const activeYear = await storage.getActiveAcademicYearFull();'
  },
  {
    old: /const activeYear = await storage\.getAnysAcademics\(\)\.then\(years => \s*years\.find\(y => y\.actiu\)\?\.id \|\| 1\s*\);/g,
    new: 'const activeYearId = await storage.getActiveAcademicYear();'
  },
  {
    old: /const activeYear = await storage\.getAnysAcademics\(\)\.then\(years => \s*years\.find\(y => y\.estat === ['"']actiu['"][\)\}]\s*\);/g,
    new: 'const activeYear = await storage.getActiveAcademicYearFull();'
  }
];

let changesCount = 0;

// Aplicar els reemplaçaments
patterns.forEach(pattern => {
  const matches = content.match(pattern.old);
  if (matches) {
    console.log(`Trobats ${matches.length} casos del patró:`, pattern.old.toString());
    content = content.replace(pattern.old, pattern.new);
    changesCount += matches.length;
  }
});

// Escriure el fitxer actualitzat
if (changesCount > 0) {
  fs.writeFileSync('server/routes.ts', content);
  console.log(`S'han fet ${changesCount} canvis per assegurar la consistència de l'any acadèmic actiu.`);
} else {
  console.log('No s\'han trobat patrons inconsistents.');
}