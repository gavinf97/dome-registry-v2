import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthCallbackComponent } from './auth/auth-callback.component';
import { SearchComponent } from './pages/search/search.component';
import { RegistryEditorComponent } from './pages/registry-editor/registry-editor.component';
import { HistoryComponent } from './pages/history/history.component';
import { UploadComponent } from './pages/upload/upload.component';
import { AdminComponent } from './pages/admin/admin.component';
import { EntryDetailComponent } from './pages/entry-detail/entry-detail.component';
import { StatsComponent } from './pages/stats/stats.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { JournalQueueComponent } from './pages/journal-queue/journal-queue.component';
import { AuthGuard, AdminGuard } from './auth/auth.guard';

const routes: Routes = [
  { path: '', redirectTo: 'search', pathMatch: 'full' },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'auth/orcid/callback', component: AuthCallbackComponent },
  { path: 'search', component: SearchComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'journal-queue', component: JournalQueueComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: UploadComponent, canActivate: [AuthGuard] },
  { path: 'registry/new', component: RegistryEditorComponent, canActivate: [AuthGuard] },
  { path: 'registry/:uuid/history', component: HistoryComponent },
  { path: 'registry/:uuid/edit', component: RegistryEditorComponent, canActivate: [AuthGuard] },
  { path: 'registry/:uuid', component: EntryDetailComponent },
  { path: 'admin', component: AdminComponent, canActivate: [AdminGuard] },
  { path: '**', redirectTo: 'search' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { onSameUrlNavigation: 'reload' })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
