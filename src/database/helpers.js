export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
export async function insert(tx, table, row) {
  const keys = Object.keys(row);
  await tx.runAsync(`INSERT INTO "${table}" (${keys.map(k => `"${k}"`).join(',')}) VALUES (${keys.map(() => '?').join(',')})`, ...keys.map(k => row[k]));
}
