import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding OSP GIS Platform...');

  // Clear existing data in dependency order
  await prisma.maintenanceLog.deleteMany();
  await prisma.incident.deleteMany();
  await prisma.connection.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.assetType.deleteMany();

  // ─── Asset Types ──────────────────────────────────────────────────────────
  const types = await Promise.all([
    prisma.assetType.create({
      data: {
        key: 'site',
        label: 'Site / POP',
        geometryKind: 'point',
        icon: 'building',
        color: '#3B82F6',
        fieldSchema: JSON.stringify([
          { key: 'site_type', label: 'Site Type', type: 'select', required: true, options: ['Exchange', 'Data Center', 'POP', 'Hub'] },
          { key: 'owner', label: 'Owner', type: 'text', required: false },
          { key: 'capacity_ports', label: 'Port Capacity', type: 'number', required: false },
          { key: 'power_backup', label: 'Power Backup', type: 'boolean', required: false },
        ]),
      },
    }),
    prisma.assetType.create({
      data: {
        key: 'bts',
        label: 'BTS Site',
        geometryKind: 'point',
        icon: 'tower-cell',
        color: '#8B5CF6',
        fieldSchema: JSON.stringify([
          { key: 'tower_height', label: 'Tower Height (m)', type: 'number', required: false },
          { key: 'operator', label: 'Operator', type: 'text', required: false },
          { key: 'technology', label: 'Technology', type: 'select', required: false, options: ['2G', '3G', '4G', '5G'] },
        ]),
      },
    }),
    prisma.assetType.create({
      data: {
        key: 'cabinet',
        label: 'Street Cabinet',
        geometryKind: 'point',
        icon: 'box',
        color: '#F59E0B',
        fieldSchema: JSON.stringify([
          { key: 'cabinet_type', label: 'Cabinet Type', type: 'select', required: true, options: ['DSLAM', 'OLT', 'Switch', 'Distribution'] },
          { key: 'port_count', label: 'Port Count', type: 'number', required: false },
          { key: 'address', label: 'Street Address', type: 'text', required: false },
        ]),
      },
    }),
    prisma.assetType.create({
      data: {
        key: 'fiber_cable',
        label: 'Fiber Cable',
        geometryKind: 'line',
        icon: 'cable',
        color: '#10B981',
        fieldSchema: JSON.stringify([
          { key: 'cable_type', label: 'Cable Type', type: 'select', required: true, options: ['Aerial', 'Underground', 'Duct', 'Direct Burial'] },
          { key: 'fiber_count', label: 'Fiber Count', type: 'number', required: true },
          { key: 'length_m', label: 'Length (m)', type: 'number', required: false },
          { key: 'installation_date', label: 'Installation Date', type: 'date', required: false },
        ]),
      },
    }),
    prisma.assetType.create({
      data: {
        key: 'manhole',
        label: 'Manhole',
        geometryKind: 'point',
        icon: 'circle',
        color: '#6B7280',
        fieldSchema: JSON.stringify([
          { key: 'depth_m', label: 'Depth (m)', type: 'number', required: false },
          { key: 'cover_type', label: 'Cover Type', type: 'select', required: false, options: ['Cast Iron', 'Concrete', 'Composite'] },
          { key: 'duct_count', label: 'Duct Count', type: 'number', required: false },
        ]),
      },
    }),
    prisma.assetType.create({
      data: {
        key: 'handhole',
        label: 'Handhole',
        geometryKind: 'point',
        icon: 'square',
        color: '#9CA3AF',
        fieldSchema: JSON.stringify([
          { key: 'size', label: 'Size', type: 'select', required: false, options: ['Small', 'Medium', 'Large'] },
          { key: 'material', label: 'Material', type: 'text', required: false },
        ]),
      },
    }),
    prisma.assetType.create({
      data: {
        key: 'splice_closure',
        label: 'Splice Closure',
        geometryKind: 'point',
        icon: 'circle-dot',
        color: '#EF4444',
        fieldSchema: JSON.stringify([
          { key: 'closure_type', label: 'Closure Type', type: 'select', required: true, options: ['Dome', 'Inline', 'Butt'] },
          { key: 'splice_count', label: 'Splice Count', type: 'number', required: false },
          { key: 'capacity', label: 'Capacity (fibers)', type: 'number', required: false },
        ]),
      },
    }),
    prisma.assetType.create({
      data: {
        key: 'pole',
        label: 'Pole',
        geometryKind: 'point',
        icon: 'minus-square',
        color: '#D97706',
        fieldSchema: JSON.stringify([
          { key: 'height_m', label: 'Height (m)', type: 'number', required: false },
          { key: 'material', label: 'Material', type: 'select', required: false, options: ['Wood', 'Steel', 'Concrete'] },
          { key: 'condition', label: 'Condition', type: 'select', required: false, options: ['Good', 'Fair', 'Poor'] },
        ]),
      },
    }),
    prisma.assetType.create({
      data: {
        key: 'fdh',
        label: 'FDH Cabinet',
        geometryKind: 'point',
        icon: 'server',
        color: '#06B6D4',
        fieldSchema: JSON.stringify([
          { key: 'port_count', label: 'Port Count', type: 'number', required: false },
          { key: 'splitter_ratio', label: 'Splitter Ratio', type: 'select', required: false, options: ['1:8', '1:16', '1:32', '1:64'] },
          { key: 'address', label: 'Street Address', type: 'text', required: false },
        ]),
      },
    }),
  ]);

  const typeMap = Object.fromEntries(types.map((t) => [t.key, t]));
  console.log(`  ✓ ${types.length} asset types created`);

  // ─── Sites / POPs (12) ────────────────────────────────────────────────────
  // Real locations: 6th October City + Cairo + Giza
  const sitesData = [
    { name: 'October City Exchange', code: 'SITE-OCT-001', lon: 30.9876, lat: 29.9387, status: 'operational', attrs: { site_type: 'Exchange', owner: 'Telecom Egypt', capacity_ports: 2048, power_backup: true } },
    { name: 'Smart Village POP', code: 'SITE-SV-001', lon: 30.9718, lat: 29.9754, status: 'operational', attrs: { site_type: 'POP', owner: 'Smart Village Co', capacity_ports: 512, power_backup: true } },
    { name: 'Juhayna Square Hub', code: 'SITE-JUH-001', lon: 31.0123, lat: 29.9521, status: 'degraded', attrs: { site_type: 'Hub', owner: 'Telecom Egypt', capacity_ports: 256, power_backup: false } },
    { name: 'Shooting Club POP', code: 'SITE-SC-001', lon: 31.0342, lat: 30.0612, status: 'operational', attrs: { site_type: 'POP', owner: 'Private', capacity_ports: 128, power_backup: true } },
    { name: 'Dokki Exchange', code: 'SITE-DOK-001', lon: 31.2115, lat: 30.0444, status: 'operational', attrs: { site_type: 'Exchange', owner: 'Telecom Egypt', capacity_ports: 4096, power_backup: true } },
    { name: 'Mohandeseen Hub', code: 'SITE-MOH-001', lon: 31.2029, lat: 30.0576, status: 'operational', attrs: { site_type: 'Hub', owner: 'Telecom Egypt', capacity_ports: 512, power_backup: true } },
    { name: 'Agouza POP', code: 'SITE-AGZ-001', lon: 31.2143, lat: 30.0636, status: 'down', attrs: { site_type: 'POP', owner: 'ISP Partner', capacity_ports: 128, power_backup: false } },
    { name: 'Zamalek Exchange', code: 'SITE-ZAM-001', lon: 31.2197, lat: 30.0654, status: 'operational', attrs: { site_type: 'Exchange', owner: 'Telecom Egypt', capacity_ports: 1024, power_backup: true } },
    { name: 'Giza Data Center', code: 'SITE-GIZ-DC', lon: 31.1987, lat: 30.0131, status: 'operational', attrs: { site_type: 'Data Center', owner: 'DCM Egypt', capacity_ports: 8192, power_backup: true } },
    { name: 'Haram Street POP', code: 'SITE-HRM-001', lon: 31.1798, lat: 30.0065, status: 'under_maintenance', attrs: { site_type: 'POP', owner: 'Telecom Egypt', capacity_ports: 256, power_backup: false } },
    { name: '6 October Industrial Hub', code: 'SITE-IND-001', lon: 30.9543, lat: 29.9189, status: 'operational', attrs: { site_type: 'Hub', owner: 'Industry Zone', capacity_ports: 512, power_backup: true } },
    { name: 'Media Production City POP', code: 'SITE-MPC-001', lon: 30.9651, lat: 29.9864, status: 'degraded', attrs: { site_type: 'POP', owner: 'MPC', capacity_ports: 256, power_backup: true } },
  ];

  const sites = await Promise.all(
    sitesData.map((s) =>
      prisma.asset.create({
        data: {
          assetTypeId: typeMap['site'].id,
          name: s.name,
          code: s.code,
          status: s.status,
          geometry: JSON.stringify({ type: 'Point', coordinates: [s.lon, s.lat] }),
          attributes: JSON.stringify(s.attrs),
        },
      })
    )
  );
  console.log(`  ✓ ${sites.length} sites created`);

  // ─── BTS Sites (3) ────────────────────────────────────────────────────────
  const btsData = [
    { name: 'BTS October North', code: 'BTS-OCT-N', lon: 30.9934, lat: 29.9512, status: 'operational', attrs: { tower_height: 40, operator: 'Vodafone', technology: '4G' } },
    { name: 'BTS Smart Village', code: 'BTS-SV-01', lon: 30.9780, lat: 29.9801, status: 'operational', attrs: { tower_height: 35, operator: 'Orange', technology: '5G' } },
    { name: 'BTS Giza West', code: 'BTS-GIZ-W', lon: 31.1654, lat: 30.0089, status: 'degraded', attrs: { tower_height: 30, operator: 'Etisalat', technology: '4G' } },
  ];

  const btsAssets = await Promise.all(
    btsData.map((b) =>
      prisma.asset.create({
        data: {
          assetTypeId: typeMap['bts'].id,
          name: b.name,
          code: b.code,
          status: b.status,
          geometry: JSON.stringify({ type: 'Point', coordinates: [b.lon, b.lat] }),
          attributes: JSON.stringify(b.attrs),
        },
      })
    )
  );
  console.log(`  ✓ ${btsAssets.length} BTS sites created`);

  // ─── Street Cabinets (5) ──────────────────────────────────────────────────
  const cabinetData = [
    { name: 'Cabinet OCT-01', code: 'CAB-OCT-001', lon: 30.9902, lat: 29.9411, status: 'operational', attrs: { cabinet_type: 'OLT', port_count: 128, address: '26 July Corridor, 6th Oct' } },
    { name: 'Cabinet OCT-02', code: 'CAB-OCT-002', lon: 30.9812, lat: 29.9456, status: 'operational', attrs: { cabinet_type: 'DSLAM', port_count: 96, address: 'Central Axis, 6th Oct' } },
    { name: 'Cabinet DOK-01', code: 'CAB-DOK-001', lon: 31.2087, lat: 30.0489, status: 'degraded', attrs: { cabinet_type: 'Switch', port_count: 48, address: 'Dokki St, Giza' } },
    { name: 'Cabinet MOH-01', code: 'CAB-MOH-001', lon: 31.1987, lat: 30.0601, status: 'operational', attrs: { cabinet_type: 'Distribution', port_count: 64, address: 'Mohandeseen, Giza' } },
    { name: 'Cabinet GIZ-01', code: 'CAB-GIZ-001', lon: 31.2012, lat: 30.0198, status: 'under_maintenance', attrs: { cabinet_type: 'OLT', port_count: 256, address: 'Faisal St, Giza' } },
  ];

  const cabinets = await Promise.all(
    cabinetData.map((c) =>
      prisma.asset.create({
        data: {
          assetTypeId: typeMap['cabinet'].id,
          name: c.name,
          code: c.code,
          status: c.status,
          geometry: JSON.stringify({ type: 'Point', coordinates: [c.lon, c.lat] }),
          attributes: JSON.stringify(c.attrs),
        },
      })
    )
  );
  console.log(`  ✓ ${cabinets.length} cabinets created`);

  // ─── Manholes (30) ────────────────────────────────────────────────────────
  // Distributed along the corridors between sites
  const manholeRaw = [
    [30.9876, 29.9350], [30.9901, 29.9330], [30.9930, 29.9310], [30.9960, 29.9295],
    [30.9990, 29.9280], [31.0020, 29.9270], [31.0050, 29.9275], [31.0080, 29.9280],
    [31.0110, 29.9300], [31.0140, 29.9320], [31.0170, 29.9340], [31.0200, 29.9360],
    [31.0250, 29.9400], [31.0320, 29.9450], [31.0390, 29.9490], [31.0450, 29.9550],
    [31.0560, 29.9630], [31.0680, 29.9720], [31.0800, 29.9820], [31.0950, 29.9920],
    [31.1100, 30.0020], [31.1250, 30.0090], [31.1400, 30.0120], [31.1550, 30.0140],
    [31.1700, 30.0145], [31.1850, 30.0148], [31.1950, 30.0150], [31.2020, 30.0155],
    [31.2080, 30.0200], [31.2100, 30.0280],
  ] as [number, number][];

  const manholeStatuses = ['operational', 'operational', 'operational', 'degraded', 'operational', 'operational', 'under_maintenance', 'operational', 'operational', 'operational'];

  const manholes = await Promise.all(
    manholeRaw.map((coord, i) =>
      prisma.asset.create({
        data: {
          assetTypeId: typeMap['manhole'].id,
          name: `Manhole ${String(i + 1).padStart(3, '0')}`,
          code: `MH-${String(i + 1).padStart(3, '0')}`,
          status: manholeStatuses[i % manholeStatuses.length],
          geometry: JSON.stringify({ type: 'Point', coordinates: coord }),
          attributes: JSON.stringify({ depth_m: 1.2 + (i % 5) * 0.3, cover_type: ['Cast Iron', 'Concrete', 'Composite'][i % 3], duct_count: 2 + (i % 4) }),
        },
      })
    )
  );
  console.log(`  ✓ ${manholes.length} manholes created`);

  // ─── Handholes (10) ───────────────────────────────────────────────────────
  const handholeCoords = [
    [31.0015, 29.9415], [31.0087, 29.9445], [31.0145, 29.9470], [31.0223, 29.9510],
    [31.0312, 29.9565], [31.0478, 29.9612], [31.0634, 29.9745], [31.1078, 30.0010],
    [31.1567, 30.0168], [31.1989, 30.0201],
  ] as [number, number][];

  const handholes = await Promise.all(
    handholeCoords.map((coord, i) =>
      prisma.asset.create({
        data: {
          assetTypeId: typeMap['handhole'].id,
          name: `Handhole ${String(i + 1).padStart(3, '0')}`,
          code: `HH-${String(i + 1).padStart(3, '0')}`,
          status: i === 3 ? 'degraded' : 'operational',
          geometry: JSON.stringify({ type: 'Point', coordinates: coord }),
          attributes: JSON.stringify({ size: ['Small', 'Medium', 'Large'][i % 3], material: i % 2 === 0 ? 'Concrete' : 'HDPE' }),
        },
      })
    )
  );
  console.log(`  ✓ ${handholes.length} handholes created`);

  // ─── Splice Closures (8) — parented to manholes ───────────────────────────
  const spliceData = [
    { mhIdx: 2, lon: 30.9935, lat: 29.9312, code: 'SC-001', type: 'Dome', splices: 48 },
    { mhIdx: 7, lon: 31.0082, lat: 29.9282, code: 'SC-002', type: 'Inline', splices: 96 },
    { mhIdx: 12, lon: 31.0252, lat: 29.9402, code: 'SC-003', type: 'Dome', splices: 48 },
    { mhIdx: 17, lon: 31.0682, lat: 29.9722, code: 'SC-004', type: 'Butt', splices: 24 },
    { mhIdx: 20, lon: 31.1102, lat: 30.0022, code: 'SC-005', type: 'Dome', splices: 96 },
    { mhIdx: 24, lon: 31.1702, lat: 30.0147, code: 'SC-006', type: 'Inline', splices: 48 },
    { mhIdx: 27, lon: 31.2022, lat: 30.0157, code: 'SC-007', type: 'Dome', splices: 144 },
    { mhIdx: 29, lon: 31.2102, lat: 30.0282, code: 'SC-008', type: 'Butt', splices: 48 },
  ];

  const spliceClosures = await Promise.all(
    spliceData.map((s) =>
      prisma.asset.create({
        data: {
          assetTypeId: typeMap['splice_closure'].id,
          name: `Splice Closure ${s.code}`,
          code: s.code,
          status: s.code === 'SC-006' ? 'degraded' : 'operational',
          geometry: JSON.stringify({ type: 'Point', coordinates: [s.lon, s.lat] }),
          attributes: JSON.stringify({ closure_type: s.type, splice_count: s.splices, capacity: s.splices * 2 }),
          parentId: manholes[s.mhIdx].id,
        },
      })
    )
  );
  console.log(`  ✓ ${spliceClosures.length} splice closures created`);

  // ─── Poles (10) ───────────────────────────────────────────────────────────
  const poleCoords = [
    [30.9888, 29.9405], [30.9921, 29.9432], [30.9956, 29.9418], [31.0034, 29.9390],
    [31.0112, 29.9365], [31.0201, 29.9480], [31.0389, 29.9611], [31.0678, 29.9789],
    [31.1089, 30.0045], [31.1678, 30.0201],
  ] as [number, number][];

  const poles = await Promise.all(
    poleCoords.map((coord, i) =>
      prisma.asset.create({
        data: {
          assetTypeId: typeMap['pole'].id,
          name: `Pole ${String(i + 1).padStart(3, '0')}`,
          code: `POLE-${String(i + 1).padStart(3, '0')}`,
          status: i === 5 ? 'under_maintenance' : 'operational',
          geometry: JSON.stringify({ type: 'Point', coordinates: coord }),
          attributes: JSON.stringify({
            height_m: 8 + (i % 4) * 2,
            material: ['Steel', 'Concrete', 'Wood'][i % 3],
            condition: i < 7 ? 'Good' : 'Fair',
          }),
        },
      })
    )
  );
  console.log(`  ✓ ${poles.length} poles created`);

  // ─── FDH Cabinets (4) ─────────────────────────────────────────────────────
  const fdhData = [
    { name: 'FDH October-01', code: 'FDH-OCT-001', lon: 30.9945, lat: 29.9478, status: 'operational', attrs: { port_count: 96, splitter_ratio: '1:32', address: 'Al Hayy Al Mutamayez, 6th Oct' } },
    { name: 'FDH October-02', code: 'FDH-OCT-002', lon: 31.0067, lat: 29.9534, status: 'operational', attrs: { port_count: 64, splitter_ratio: '1:16', address: 'Al Andalus St, 6th Oct' } },
    { name: 'FDH Dokki-01', code: 'FDH-DOK-001', lon: 31.2045, lat: 30.0512, status: 'degraded', attrs: { port_count: 128, splitter_ratio: '1:32', address: 'Tahrir Sq Access, Dokki' } },
    { name: 'FDH Giza-01', code: 'FDH-GIZ-001', lon: 31.2001, lat: 30.0089, status: 'operational', attrs: { port_count: 192, splitter_ratio: '1:64', address: 'Faisal/Pyramids Rd, Giza' } },
  ];

  const fdhCabinets = await Promise.all(
    fdhData.map((f) =>
      prisma.asset.create({
        data: {
          assetTypeId: typeMap['fdh'].id,
          name: f.name,
          code: f.code,
          status: f.status,
          geometry: JSON.stringify({ type: 'Point', coordinates: [f.lon, f.lat] }),
          attributes: JSON.stringify(f.attrs),
        },
      })
    )
  );
  console.log(`  ✓ ${fdhCabinets.length} FDH cabinets created`);

  // ─── Fiber Cable Routes (15) ──────────────────────────────────────────────
  // LineStrings connecting sites through the corridor
  const fiberRoutes = [
    {
      name: 'OCT Exchange — Smart Village Ring',
      code: 'FC-001',
      status: 'operational',
      attrs: { cable_type: 'Underground', fiber_count: 96, length_m: 4200, installation_date: '2021-03-15' },
      coords: [[30.9876, 29.9387], [30.9800, 29.9550], [30.9718, 29.9754]],
    },
    {
      name: 'OCT — Juhayna Corridor',
      code: 'FC-002',
      status: 'operational',
      attrs: { cable_type: 'Underground', fiber_count: 48, length_m: 3100, installation_date: '2021-05-20' },
      coords: [[30.9876, 29.9387], [30.9950, 29.9430], [31.0050, 29.9470], [31.0123, 29.9521]],
    },
    {
      name: 'Smart Village — Juhayna Link',
      code: 'FC-003',
      status: 'degraded',
      attrs: { cable_type: 'Aerial', fiber_count: 24, length_m: 5800, installation_date: '2020-11-10' },
      coords: [[30.9718, 29.9754], [30.9850, 29.9700], [30.9980, 29.9610], [31.0123, 29.9521]],
    },
    {
      name: 'Juhayna — Shooting Club Trunk',
      code: 'FC-004',
      status: 'operational',
      attrs: { cable_type: 'Underground', fiber_count: 144, length_m: 12400, installation_date: '2020-06-01' },
      coords: [[31.0123, 29.9521], [31.0230, 29.9620], [31.0350, 29.9750], [31.0450, 29.9890], [31.0342, 30.0612]],
    },
    {
      name: 'Shooting Club — Dokki Trunk',
      code: 'FC-005',
      status: 'operational',
      attrs: { cable_type: 'Underground', fiber_count: 288, length_m: 15600, installation_date: '2019-09-14' },
      coords: [[31.0342, 30.0612], [31.0650, 30.0580], [31.0950, 30.0530], [31.1200, 30.0500], [31.2115, 30.0444]],
    },
    {
      name: 'Dokki — Mohandeseen Feeder',
      code: 'FC-006',
      status: 'operational',
      attrs: { cable_type: 'Duct', fiber_count: 48, length_m: 1400, installation_date: '2022-02-28' },
      coords: [[31.2115, 30.0444], [31.2072, 30.0510], [31.2029, 30.0576]],
    },
    {
      name: 'Mohandeseen — Agouza Link',
      code: 'FC-007',
      status: 'operational',
      attrs: { cable_type: 'Duct', fiber_count: 24, length_m: 800, installation_date: '2022-04-10' },
      coords: [[31.2029, 30.0576], [31.2086, 30.0606], [31.2143, 30.0636]],
    },
    {
      name: 'Agouza — Zamalek Ring',
      code: 'FC-008',
      status: 'down',
      attrs: { cable_type: 'Underground', fiber_count: 48, length_m: 1100, installation_date: '2021-08-05' },
      coords: [[31.2143, 30.0636], [31.2170, 30.0645], [31.2197, 30.0654]],
    },
    {
      name: 'Giza DC — Dokki Backbone',
      code: 'FC-009',
      status: 'operational',
      attrs: { cable_type: 'Underground', fiber_count: 576, length_m: 8900, installation_date: '2019-01-20' },
      coords: [[31.1987, 30.0131], [31.2000, 30.0200], [31.2045, 30.0300], [31.2115, 30.0444]],
    },
    {
      name: 'Giza DC — Haram St Feeder',
      code: 'FC-010',
      status: 'operational',
      attrs: { cable_type: 'Duct', fiber_count: 96, length_m: 6200, installation_date: '2020-07-15' },
      coords: [[31.1987, 30.0131], [31.1900, 30.0110], [31.1850, 30.0082], [31.1798, 30.0065]],
    },
    {
      name: 'Haram St — Giza Axis',
      code: 'FC-011',
      status: 'under_maintenance',
      attrs: { cable_type: 'Underground', fiber_count: 48, length_m: 4100, installation_date: '2020-03-22' },
      coords: [[31.1798, 30.0065], [31.1875, 30.0050], [31.1987, 30.0131]],
    },
    {
      name: 'Industrial Hub — OCT Exchange Link',
      code: 'FC-012',
      status: 'operational',
      attrs: { cable_type: 'Direct Burial', fiber_count: 24, length_m: 3800, installation_date: '2022-09-01' },
      coords: [[30.9543, 29.9189], [30.9620, 29.9250], [30.9710, 29.9310], [30.9876, 29.9387]],
    },
    {
      name: 'Media City — Smart Village Spur',
      code: 'FC-013',
      status: 'degraded',
      attrs: { cable_type: 'Aerial', fiber_count: 12, length_m: 2900, installation_date: '2021-12-05' },
      coords: [[30.9651, 29.9864], [30.9680, 29.9820], [30.9710, 29.9790], [30.9718, 29.9754]],
    },
    {
      name: 'OCT Ring — South Loop',
      code: 'FC-014',
      status: 'operational',
      attrs: { cable_type: 'Underground', fiber_count: 48, length_m: 5100, installation_date: '2023-01-18' },
      coords: [[30.9876, 29.9387], [30.9800, 29.9300], [30.9720, 29.9210], [30.9651, 29.9180], [30.9543, 29.9189]],
    },
    {
      name: 'Shooting Club — Mohandeseen Direct',
      code: 'FC-015',
      status: 'operational',
      attrs: { cable_type: 'Underground', fiber_count: 96, length_m: 9200, installation_date: '2022-06-30' },
      coords: [[31.0342, 30.0612], [31.0680, 30.0600], [31.1000, 30.0588], [31.1400, 30.0580], [31.2029, 30.0576]],
    },
  ];

  const fiberAssets = await Promise.all(
    fiberRoutes.map((r) =>
      prisma.asset.create({
        data: {
          assetTypeId: typeMap['fiber_cable'].id,
          name: r.name,
          code: r.code,
          status: r.status,
          geometry: JSON.stringify({ type: 'LineString', coordinates: r.coords }),
          attributes: JSON.stringify(r.attrs),
        },
      })
    )
  );
  console.log(`  ✓ ${fiberAssets.length} fiber cable routes created`);

  // ─── Connections ──────────────────────────────────────────────────────────
  const connectionPairs = [
    { from: sites[0], to: sites[1], cable: fiberAssets[0], fibers: 96 },   // OCT — SV
    { from: sites[0], to: sites[2], cable: fiberAssets[1], fibers: 48 },   // OCT — Juhayna
    { from: sites[1], to: sites[2], cable: fiberAssets[2], fibers: 24 },   // SV — Juhayna
    { from: sites[2], to: sites[3], cable: fiberAssets[3], fibers: 144 },  // Juhayna — Shooting Club
    { from: sites[3], to: sites[4], cable: fiberAssets[4], fibers: 288 },  // SC — Dokki
    { from: sites[4], to: sites[5], cable: fiberAssets[5], fibers: 48 },   // Dokki — Mohandeseen
    { from: sites[5], to: sites[6], cable: fiberAssets[6], fibers: 24 },   // Mohandeseen — Agouza
    { from: sites[6], to: sites[7], cable: fiberAssets[7], fibers: 48 },   // Agouza — Zamalek
    { from: sites[8], to: sites[4], cable: fiberAssets[8], fibers: 576 },  // Giza DC — Dokki
    { from: sites[8], to: sites[9], cable: fiberAssets[9], fibers: 96 },   // Giza DC — Haram
    { from: sites[0], to: sites[10], cable: fiberAssets[11], fibers: 24 }, // OCT — Industrial
    { from: sites[1], to: sites[11], cable: fiberAssets[12], fibers: 12 }, // SV — Media City
    { from: sites[3], to: sites[5], cable: fiberAssets[14], fibers: 96 },  // SC — Mohandeseen
  ];

  await Promise.all(
    connectionPairs.map((c) =>
      prisma.connection.create({
        data: {
          fromAssetId: c.from.id,
          toAssetId: c.to.id,
          cableAssetId: c.cable.id,
          fiberCount: c.fibers,
          notes: `Fiber link via ${c.cable.name}`,
        },
      })
    )
  );
  console.log(`  ✓ ${connectionPairs.length} connections created`);

  // ─── Incidents (15) ───────────────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

  const incidentData = [
    // Open incidents
    { asset: sites[6], category: 'Power', severity: 'critical', status: 'open', openedAt: daysAgo(2), desc: 'Site completely down — UPS failure, no power backup available.' },
    { asset: fiberAssets[7], category: 'Physical Damage', severity: 'high', status: 'open', openedAt: daysAgo(1), desc: 'Fiber cut on Agouza—Zamalek link, construction crew accident.' },
    { asset: sites[2], category: 'Performance', severity: 'medium', status: 'open', openedAt: daysAgo(4), desc: 'High packet loss on Juhayna Square aggregation — possible card failure.' },
    { asset: spliceClosures[5], category: 'Physical Damage', severity: 'medium', status: 'open', openedAt: daysAgo(6), desc: 'Splice closure cover cracked after road works.' },
    { asset: btsAssets[2], category: 'Performance', severity: 'low', status: 'open', openedAt: daysAgo(8), desc: 'Elevated BER on Giza West BTS, monitoring.' },
    // Investigating
    { asset: fiberAssets[2], category: 'Performance', severity: 'medium', status: 'investigating', openedAt: daysAgo(12), desc: 'Intermittent signal loss on Smart Village—Juhayna aerial span.' },
    { asset: sites[9], category: 'Power', severity: 'high', status: 'investigating', openedAt: daysAgo(9), desc: 'Generator failure during grid outage — site on battery backup.' },
    { asset: cabinets[2], category: 'Performance', severity: 'low', status: 'investigating', openedAt: daysAgo(14), desc: 'Cabinet DOK-01 temperature alarm — cooling fan degraded.' },
    { asset: fiberAssets[10], category: 'Performance', severity: 'medium', status: 'investigating', openedAt: daysAgo(20), desc: 'High OTDR reflection on Haram St loop, suspected splice issue.' },
    { asset: manholes[14], category: 'Physical', severity: 'low', status: 'investigating', openedAt: daysAgo(18), desc: 'Manhole flooded after heavy rain, access restricted.' },
    // Resolved
    { asset: sites[11], category: 'Performance', severity: 'medium', status: 'resolved', openedAt: daysAgo(30), resolvedAt: daysAgo(28), desc: 'Media Production City POP — route flap on core link, BGP restarted.' },
    { asset: fiberAssets[0], category: 'Physical Damage', severity: 'high', status: 'resolved', openedAt: daysAgo(45), resolvedAt: daysAgo(43), desc: 'Micro-crack in OCT—SV underground section, OTDR-located and spliced.' },
    { asset: poles[5], category: 'Physical', severity: 'low', status: 'resolved', openedAt: daysAgo(60), resolvedAt: daysAgo(59), desc: 'Pole lean exceeding 5° — contractor re-straightened and concrete base repaired.' },
    { asset: sites[4], category: 'Power', severity: 'high', status: 'resolved', openedAt: daysAgo(55), resolvedAt: daysAgo(54), desc: 'Dokki Exchange UPS battery replacement completed — 4-hour maintenance window.' },
    { asset: fiberAssets[4], category: 'Performance', severity: 'medium', status: 'resolved', openedAt: daysAgo(70), resolvedAt: daysAgo(68), desc: 'SC—Dokki trunk DWDM alarm, amplifier card replaced.' },
  ];

  await Promise.all(
    incidentData.map((i) =>
      prisma.incident.create({
        data: {
          assetId: i.asset.id,
          category: i.category,
          severity: i.severity,
          status: i.status,
          openedAt: i.openedAt,
          resolvedAt: (i as { resolvedAt?: Date }).resolvedAt ?? null,
          description: i.desc,
        },
      })
    )
  );
  console.log(`  ✓ ${incidentData.length} incidents created`);

  // ─── Maintenance Logs (20) ────────────────────────────────────────────────
  const maintenanceData = [
    { asset: sites[0], date: daysAgo(90), type: 'Preventive', tech: 'Ahmed Hassan', notes: 'Annual power system inspection, battery bank load test passed.' },
    { asset: sites[4], date: daysAgo(54), type: 'Corrective', tech: 'Omar Khalil', notes: 'UPS battery bank replacement (48V/200Ah). Restored normal operation.' },
    { asset: fiberAssets[0], date: daysAgo(43), type: 'Corrective', tech: 'Sayed Ibrahim', notes: 'OTDR-located break at 2.1km, mechanical splice installed, loss <0.3dB.' },
    { asset: manholes[4], date: daysAgo(30), type: 'Preventive', tech: 'Khaled Amer', notes: 'Cover inspection and replacement, rodent-proof sealing applied.' },
    { asset: poles[5], date: daysAgo(59), type: 'Corrective', tech: 'Tarek Sami', notes: 'Pole realignment and base concrete poured. Load test completed.' },
    { asset: sites[1], date: daysAgo(120), type: 'Preventive', tech: 'Nasser Ali', notes: 'Cooling system filter replacement and capacity check.' },
    { asset: fiberAssets[4], date: daysAgo(68), type: 'Corrective', tech: 'Ahmed Hassan', notes: 'DWDM line amplifier card swapped. Signal levels restored to nominal.' },
    { asset: cabinets[0], date: daysAgo(45), type: 'Preventive', tech: 'Omar Khalil', notes: 'OLT software upgrade to v4.2.1, no service disruption.' },
    { asset: spliceClosures[0], date: daysAgo(180), type: 'Preventive', tech: 'Sayed Ibrahim', notes: 'Dome inspection, moisture check, re-sealed entry points.' },
    { asset: sites[8], date: daysAgo(15), type: 'Preventive', tech: 'Khaled Amer', notes: 'Data center cooling audit, chillers cleaned and refrigerant checked.' },
    { asset: fiberAssets[8], date: daysAgo(200), type: 'Preventive', tech: 'Tarek Sami', notes: 'Full OTDR sweep of Giza DC backbone, all values within spec.' },
    { asset: btsAssets[0], date: daysAgo(60), type: 'Preventive', tech: 'Nasser Ali', notes: 'BTS antenna alignment check and RF sweep at October North.' },
    { asset: manholes[19], date: daysAgo(25), type: 'Preventive', tech: 'Ahmed Hassan', notes: 'Pump test and duct labeling update.' },
    { asset: fdhCabinets[0], date: daysAgo(35), type: 'Preventive', tech: 'Omar Khalil', notes: 'SC/APC connector cleaning, insertion loss measured <0.5dB on all ports.' },
    { asset: sites[3], date: daysAgo(100), type: 'Preventive', tech: 'Sayed Ibrahim', notes: 'Shooting Club POP battery float charge adjustment and UPS self-test.' },
    { asset: fiberAssets[9], date: daysAgo(150), type: 'Preventive', tech: 'Khaled Amer', notes: 'OTDR trace on Giza DC—Haram feeder, no anomalies found.' },
    { asset: cabinets[3], date: daysAgo(20), type: 'Preventive', tech: 'Tarek Sami', notes: 'Cabinet environmental seal inspection and rodent trap check.' },
    { asset: sites[5], date: daysAgo(75), type: 'Preventive', tech: 'Nasser Ali', notes: 'Mohandeseen Hub rack audit and cable management tidy.' },
    { asset: fiberAssets[14], date: daysAgo(10), type: 'Preventive', tech: 'Ahmed Hassan', notes: 'OTDR on SC—Mohandeseen direct route, all splices <0.2dB.' },
    { asset: manholes[8], date: daysAgo(50), type: 'Preventive', tech: 'Omar Khalil', notes: 'Duct integrity test and cover replacement at MH-009.' },
  ];

  await Promise.all(
    maintenanceData.map((m) =>
      prisma.maintenanceLog.create({
        data: {
          assetId: m.asset.id,
          date: m.date,
          type: m.type,
          technician: m.tech,
          notes: m.notes,
        },
      })
    )
  );
  console.log(`  ✓ ${maintenanceData.length} maintenance logs created`);

  const totalAssets = await prisma.asset.count();
  console.log(`\n✅ Seed complete! ${totalAssets} assets total in database.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
