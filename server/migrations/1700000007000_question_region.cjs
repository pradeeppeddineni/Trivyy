/* eslint-disable */
/**
 * Schema v9 — regional questions (spec v3 §5.6). `region` is an ISO-3166 alpha-2
 * code (e.g. 'IN' for India); NULL means global/no-region. It is a filter
 * dimension orthogonal to category. Additive (DB-2). Index mirrors the existing
 * category index so the picker stays cheap (DB-4).
 */

exports.up = (pgm) => {
  pgm.addColumn('questions', {
    region: { type: 'varchar(2)' },
  });
  pgm.createIndex('questions', ['region', 'category_id', 'difficulty', 'status']);
};

exports.down = (pgm) => {
  pgm.dropIndex('questions', ['region', 'category_id', 'difficulty', 'status']);
  pgm.dropColumn('questions', 'region');
};
