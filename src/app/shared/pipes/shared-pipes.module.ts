import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ExcerptPipe } from "./excerpt.pipe";
import { GetValueByKeyPipe } from "./get-value-by-key.pipe";
import { RelativeTimePipe } from "./relative-time.pipe";
import { ToFixedPipe } from "./ToFixedPipe";
import { NullEmptyToDashPipe } from "./NullEmptyToDashPipe.pipe";

const pipes = [
  ExcerptPipe,
  GetValueByKeyPipe,
  RelativeTimePipe,
  ToFixedPipe,
  NullEmptyToDashPipe,
];

@NgModule({
  imports: [CommonModule],
  declarations: pipes,
  exports: pipes,
})
export class SharedPipesModule {}
