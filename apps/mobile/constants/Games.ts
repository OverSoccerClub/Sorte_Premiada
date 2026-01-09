export const GAMES = [
    { id: "2x1000", name: "2x1000", color: "bg-emerald-600", icon: "cash-outline", borderColor: "border-emerald-500/30" },
    // Future games can be added here
];

export const GAME_FILTERS = [
    { id: 'ALL', label: 'Todos' },
    ...GAMES.map(g => ({ id: g.id, label: g.name }))
];
