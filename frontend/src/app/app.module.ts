import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { AuthInterceptor } from './auth/auth.interceptor';
import { AuthCallbackComponent } from './auth/auth-callback.component';
import { DomeFieldComponent } from './shared/dome-field/dome-field.component';
import { DomeSectionComponent } from './shared/dome-section/dome-section.component';
import { SearchComponent } from './pages/search/search.component';
import { RegistryEditorComponent } from './pages/registry-editor/registry-editor.component';
import { HistoryComponent } from './pages/history/history.component';
import { UploadComponent } from './pages/upload/upload.component';
import { AdminComponent } from './pages/admin/admin.component';
import { EntryDetailComponent } from './pages/entry-detail/entry-detail.component';
import { StatsComponent } from './pages/stats/stats.component';

@NgModule({
  declarations: [
    AppComponent,
    AuthCallbackComponent,
    DomeFieldComponent,
    DomeSectionComponent,
    SearchComponent,
    RegistryEditorComponent,
    HistoryComponent,
    UploadComponent,
    AdminComponent,
    EntryDetailComponent,
    StatsComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
  ],
  providers: [
    DatePipe,
    DecimalPipe,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
