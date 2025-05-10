export function range(size: number): number[] {
    return Array.from({ length: size }).map((_, index) => {
        return index;
    });
}
