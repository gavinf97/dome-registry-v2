import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthCallbackComponent } from './auth/auth-callback.component';
import { HomeComponent } from './pages/home/home.component';
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
import { AboutComponent } from './pages/about/about.component';
import { AboutOverviewComponent } from './pages/about/about-overview.component';
import { AboutIntegrationsComponent } from './pages/about/about-integrations.component';
import { AboutTeamComponent } from './pages/about/about-team.component';
import { AboutGovernanceComponent } from './pages/about/about-governance.component';
import { AboutPoliciesComponent } from './pages/about/about-policies.component';
import { AboutNewsComponent } from './pages/about/about-news.component';
import { HelpComponent } from './pages/help/help.component';
import { HelpGuideComponent } from './pages/help/help-guide.component';
import { ApiDocsComponent } from './pages/api-docs/api-docs.component';

const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'home', redirectTo: '', pathMatch: 'full' },
  { path: 'auth/callback', component: AuthCallbackComponent },
  { path: 'auth/orcid/callback', component: AuthCallbackComponent },
  { path: 'search', component: SearchComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'about', component: AboutComponent, children: [
    { path: '', redirectTo: 'overview', pathMatch: 'full' },
    { path: 'overview', component: AboutOverviewComponent },
    { path: 'integrations', component: AboutIntegrationsComponent },
    { path: 'team', component: AboutTeamComponent },
    { path: 'governance', component: AboutGovernanceComponent },
    { path: 'policies', component: AboutPoliciesComponent },
    { path: 'news', component: AboutNewsComponent },
  ]},
  { path: 'help', component: HelpComponent, children: [
    { path: '', redirectTo: 'guide', pathMatch: 'full' },
    { path: 'guide', component: HelpGuideComponent },
    { path: 'docs', component: ApiDocsComponent },
  ]},
  { path: 'api-docs', redirectTo: '/help/docs', pathMatch: 'full' },
  { path: 'profile', component: ProfileComponent, canActivate: [AuthGuard] },
  { path: 'journal-queue', component: JournalQueueComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: UploadComponent },
  { path: 'registry/new', component: RegistryEditorComponent },
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
