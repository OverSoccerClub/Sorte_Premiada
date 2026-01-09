export function objectsToCsv(rows: Record<string, any>[]): string {
    if (!rows || rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
        if (v === null || v === undefined) return '';
        const s = typeof v === 'string' ? v : String(v);
        if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    };

    const lines = [headers.join(',')];
    for (const row of rows) {
        const vals = headers.map(h => escape(row[h]));
        lines.push(vals.join(','));
    }

    return lines.join('\n');
}
