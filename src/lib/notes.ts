export function getLastNote(notes: string | null): string {
    if (!notes) return '';

    // Split by the pattern we use for timestamps: "\n\n["
    // We look for the last occurrence of "\n\n[" or just parse the last meaningful block.

    // Simple approach: split by double newline
    const entries = notes.split('\n\n');

    // Filter out empty entries
    const validEntries = entries.filter(e => e.trim().length > 0);

    if (validEntries.length > 0) {
        return validEntries[validEntries.length - 1];
    }

    return notes;
}
