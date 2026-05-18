import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { DropdownAnchorDirective } from "./dropdown-anchor.directive";
import { DropdownLinkDirective } from "./dropdown-link.directive";
import { AppDropdownDirective } from "./dropdown.directive";
import { ScrollToDirective } from "./scroll-to.directive";
import {
  SidebarDirective,
  SidebarContainerDirective,
  SidebarContentDirective,
  SidebarTogglerDirective,
} from "./sidebar.directive";
import { HighlightjsDirective } from "./highlightjs.directive";
import { FullScreenWindowDirective } from "./full-screen.directive";
import { FileDndDirective } from "./file-dnd.directive";
import { PositiveNumberOnlyDirective } from "./positive-number-only.directive";
import { AllowAlphanumericOnlyDirective } from "./allow-alphanumeric-only.directive";
import { AllowAlphabetsOnlyDirective } from "./allow-alphabets-only";
import { ShowYearOnlyDirective } from "./show-year-only.directive";
import { TwoDigitDecimalNumberDirective } from "./two-digit-decimal-number.directive";
import { TwoDigitDecimalNumberNoZeroDirective } from "./two-digit-decimal-number-no-zero.directive";
import { PositiveNumberNoZeroDirective } from "./positive-number-no-zero.directive";

const directives = [
  DropdownAnchorDirective,
  DropdownLinkDirective,
  AppDropdownDirective,
  ScrollToDirective,
  SidebarDirective,
  SidebarContainerDirective,
  SidebarContentDirective,
  SidebarTogglerDirective,
  HighlightjsDirective,
  FullScreenWindowDirective,
  FileDndDirective,
  PositiveNumberOnlyDirective,
  AllowAlphanumericOnlyDirective,
  AllowAlphabetsOnlyDirective,
  ShowYearOnlyDirective,
  TwoDigitDecimalNumberDirective,
  TwoDigitDecimalNumberNoZeroDirective,
  PositiveNumberNoZeroDirective,
];

@NgModule({
  imports: [CommonModule],
  declarations: directives,
  exports: directives,
})
export class SharedDirectivesModule {}
