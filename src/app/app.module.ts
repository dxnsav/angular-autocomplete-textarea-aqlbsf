import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { HelloComponent } from './hello.component';
import { AutocompleteTextareaComponent } from './autocomplete-textarea/autocomplete-textarea.component';

@NgModule({
  imports: [BrowserModule, FormsModule],
  declarations: [AppComponent, HelloComponent, AutocompleteTextareaComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
