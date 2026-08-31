export declare function generateIdFromFsPath(fsPath: string): string;
export interface MediaItemKeyFields {
    id: string;
    extension: string;
    stem: string;
    path: string;
    fsPath: string;
    [key: string]: unknown;
}
export declare function mediaItemFieldsFromKey(key: string): MediaItemKeyFields;
