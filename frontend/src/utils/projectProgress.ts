export const getDisplayProgress = (status: string | undefined): number => {
    if (!status) return 0;
    const statusMap: Record<string, number> = {
        "lead": 0, "pitching": 0, "planning": 0, "Planning": 0,
        "production": 1, "In Progress": 1, "in progress": 1,
        "post-production": 2, "Review": 2, "review": 2,
        "completed": 3, "Completed": 3,
        "canceled": -1, "Other": -1, "other": -1
    };
    const idx = statusMap[status] ?? -1;
    return idx === 3 ? 100 : idx === 2 ? 75 : idx === 1 ? 50 : idx === 0 ? 25 : 0;
};
