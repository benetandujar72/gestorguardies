Why you should do it regularly: https://github.com/browserslist/update-db#readme
3:14:28 PM [express] GET /api/auth/user 304 in 483ms :: {"id":"36895369","email":"benet.andujar@insb…
3:14:32 PM [express] GET /api/guardies 304 in 193ms :: [{"id":13,"data":"2025-06-03","horaInici":"08…
=== ANALITZANT 10 PROFESSORS ===
Professor Núria Blanch Torres (ID: 9) - Prioritat: 30 - Motiu: Disponible
Professor Montse Font Camps (ID: 7) - Prioritat: 30 - Motiu: Disponible
Professor Maria García López (ID: 1) - SALTAT (ja assignat)
Professor Joan Martí Vidal (ID: 2) - Prioritat: 31 - Motiu: Disponible
Professor Francesc Pons Duran (ID: 10) - Prioritat: 20 - Motiu: Cargo administrativo: undefined
Professor Anna Puig Ferrer (ID: 3) - Prioritat: 31 - Motiu: Disponible
Professor Laura Roca Mir (ID: 5) - Prioritat: 30 - Motiu: Disponible
Professor Josep Ros Alemany (ID: 8) - Prioritat: 30 - Motiu: Disponible
Professor Pere Solà Rams (ID: 4) - Prioritat: 31 - Motiu: Disponible
Professor Carles Vila Benet (ID: 6) - Prioritat: 30 - Motiu: Disponible
=== ASSIGNACIÓ AUTOMÀTICA GUÀRDIA 1 ===
Data: 2025-05-30, Hora: 08:00:00-09:00:00, Tipus: biblioteca
Professors disponibles analitzats: 9
=== TOP 5 PROFESSORS PER PRIORITAT ===
1. Professor ID 10 - Prioritat: 20 - Motiu: Cargo administrativo: undefined - Score: 0
2. Professor ID 9 - Prioritat: 30 - Motiu: Disponible - Score: 0
3. Professor ID 7 - Prioritat: 30 - Motiu: Disponible - Score: 0
4. Professor ID 5 - Prioritat: 30 - Motiu: Disponible - Score: 0
5. Professor ID 8 - Prioritat: 30 - Motiu: Disponible - Score: 0
=== PROFESSORS SELECCIONATS (1/1) ===
1. Professor ID 10 - Prioritat: 20 - Motiu: Cargo administrativo: undefined
Creant assignació per Professor ID 10 amb prioritat 20
Assignació creada amb ID 6
Error actualizando métricas: error: insert or update on table "metrics" violates foreign key constraint "metrics_usuari_id_users_id_fk"
    at file:///home/runner/workspace/node_modules/@neondatabase/serverless/index.mjs:1345:74
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
    at async DatabaseStorage.createMetric (/home/runner/workspace/server/storage.ts:544:5)
    at async GuardAssignmentEngine.updateMetrics (/home/runner/workspace/server/guard-assignment-engine.ts:316:9)
    at async GuardAssignmentEngine.assignGuardAutomatically (/home/runner/workspace/server/guard-assignment-engine.ts:85:7)
    at async <anonymous> (/home/runner/workspace/server/routes.ts:384:28) {
  length: 276,
  severity: 'ERROR',
  code: '23503',
  detail: 'Key (usuari_id)=(sistema) is not present in table "users".',
  hint: undefined,
  position: undefined,
  internalPosition: undefined,
  internalQuery: undefined,
  where: undefined,
  schema: 'public',
  table: 'metrics',
  column: undefined,
  dataType: undefined,
  constraint: 'metrics_usuari_id_users_id_fk',
  file: 'ri_triggers.c',
  line: '2608',
  routine: 'ri_ReportViolation'
}
3:15:04 PM [express] POST /api/assignacions-guardia/auto-assign 200 in 1818ms :: {"success":true,"as…
3:15:05 PM [express] GET /api/guardies 304 in 177ms :: [{"id":13,"data":"2025-06-03","horaInici":"08…
3:17:17 PM [express] GET /api/auth/user 304 in 453ms :: {"id":"36895369","email":"benet.andujar@insb…
