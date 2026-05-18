import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { AuthService } from './shared/services/auth.service';
import { DragService } from './shared/services/drag.service';
import { SignalRService } from './shared/services/signal-r.service';
import { TranslateService } from '@ngx-translate/core';
import { LocalStoreService } from './shared/services/local-store.service';
import { GlobalDataService } from './shared/services/globalData.service';
import { TenantService } from './shared/services/Tenant.service';
import { RuntimeConfigService } from './shared/services/runtime-config.service';
const project = require('../../package.json');

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, AfterViewChecked {
  constructor(
    private translate: TranslateService,
    public authService: AuthService,
    private dragService: DragService,
    public signalRService: SignalRService,
    private titleService: Title,
    public globalDataService: GlobalDataService,
    private tenantService: TenantService,
    private runtimeConfigService: RuntimeConfigService,
  ) {
    this.titleService.setTitle('EaseWorq Admin ' + this.get_version());
    if (this.authService.getEncryptedToken()) {
      this.signalRService.startConnection();
    }
  }

  async ngOnInit(): Promise<void> {
    if (this.globalDataService.getTenantSettings()) {
      const tenantSettingResult = this.globalDataService.getTenantSettings();
      if (tenantSettingResult.setting != null) {
        this.tenantService.setLocalTenanetSettings(tenantSettingResult);
      } else {
        this.tenantService.getTenanetSettings();
      }
    } else {
      const tenantId = this.globalDataService.getCurrentTanantId();
      if (tenantId) {
        this.tenantService.getTenanetSettings();
      }
    }

    this.runtimeConfigService.loadConfig().subscribe(
      () => console.log('Runtime configuration loaded successfully'),
      (error) => console.error('Failed to load runtime configuration:', error)
    );
  }

  ngAfterViewChecked(): void {
    this.subscribeDraggables();
  }

  subscribeDraggables() {
    let elements: any = document.getElementsByClassName('draggable');
    if (elements) {
      for (let i = 0; i < elements.length; i++) {
        this.dragService.dragElement(elements[i]);
      }
    }
  }

  get_version() {
    return `version ${project.version}`;
  }
}
