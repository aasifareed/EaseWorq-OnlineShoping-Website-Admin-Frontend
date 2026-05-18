/* common interfaces for displaying  static values dropdowns */
export interface DropdownItem {
    id: number;
    value: string;
}
export interface Dropdown {
    id: string;
    value: string;
}
export interface ValueTextPair {
    value: string;
    text: string;
}
export class DropdownList {
    text: string;
    items: Dropdown[];
}
export class DropdownItemList {
    text: string;
    items: DropdownItem[];
}