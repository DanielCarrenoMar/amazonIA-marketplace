export interface ITribe {
    id?: number;
    name: string;
    description?: string;
    locationMapboxId?: string;
    locationFormattedAddress?: string;
}
export interface ICreateTribe extends Omit<ITribe, 'id'> {
}
export interface IUpdateTribe extends Partial<ICreateTribe> {
}
//# sourceMappingURL=tribe.interface.d.ts.map