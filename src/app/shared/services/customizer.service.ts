import { Injectable } from "@angular/core";
import { Router, NavigationStart } from "@angular/router";
import { TranslateService } from "@ngx-translate/core";
import { filter } from "rxjs/operators";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: "root"
})
export class CustomizerService {
  currentLanguage;
  public layouts = [
    {
      title: "Sidebar Compact",
      name: "applayout-sidebar-compact",
      img: "./assets/images/screenshots/02_preview.png",
      active: false
    },
    {
      title: "Sidebar Large",
      name: "applayout-sidebar-large",
      img: "./assets/images/screenshots/04_preview.png",
      active: true
    }
  ];
  selectedLayout;

  colors = [
    {
      sidebarClass: "sidebar-gradient-purple-indigo",
      class: "gradient-purple-indigo",
      active: false
    },
    {
      sidebarClass: "sidebar-gradient-black-blue",
      class: "gradient-black-blue",
      active: false
    },
    {
      sidebarClass: "sidebar-gradient-black-gray",
      class: "gradient-black-gray",
      active: false
    },
    {
      sidebarClass: "sidebar-gradient-steel-gray",
      class: "gradient-steel-gray",
      active: false
    },

    {
      sidebarClass: "sidebar-dark-purple",
      class: "dark-purple",
      active: true
    },
    {
      sidebarClass: "sidebar-slate-gray",
      class: "slate-gray",
      active: false
    },
    {
      sidebarClass: "sidebar-midnight-blue",
      class: "midnight-blue",
      active: false
    },
    {
      sidebarClass: "sidebar-blue",
      class: "blue",
      active: false
    },
    {
      sidebarClass: "sidebar-indigo",
      class: "indigo",
      active: false
    },
    {
      sidebarClass: "sidebar-pink",
      class: "pink",
      active: false
    },
    {
      sidebarClass: "sidebar-red",
      class: "red",
      active: false
    },
    {
      sidebarClass: "sidebar-purple",
      class: "purple",
      active: false
    }
  ];
  selectedSidebarColor;
  langs = ['en', 'ar'];

  private _isDarkMode = false
  get isDarkMode() {
    return this._isDarkMode
  }

  constructor(private router: Router,
    private translateService: TranslateService,
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationStart))
      .subscribe((event: NavigationStart) => {
        // if (event.url.indexOf("applayout-") === -1) {
        //   if (event.url.indexOf("sessions") !== -1) {
        //     return;
        //   }
        // let url = "/" + this.selectedLayout.name + event.url;
        // this.router.navigateByUrl(url);
        //}
      });
    this._isDarkMode = true
    this.changeCssFile();
  }


  changeCssFile() {
    let headTag = document.getElementsByTagName("head")[0] as HTMLHeadElement;
    let existingLink = document.getElementById("langCss") as HTMLLinkElement;
    let bundleName = this._isDarkMode ? "arabicStyle.css" : "englishStyle.css";
    if (existingLink) {
      existingLink.href = bundleName;
    } else {
      let newLink = document.createElement("link");
      newLink.rel = "stylesheet";
      newLink.type = "text/css";
      newLink.id = "langCss";
      newLink.href = bundleName;
      headTag.appendChild(newLink);
    }
    // ArcGIS no longer used - commented out to prevent CSP errors
    // this.setEsriStyles();
  }


  setEsriStyles() {
    let headTag = document.getElementsByTagName("head")[0] as HTMLHeadElement;
    let esriDarkCss = document.getElementById("esriDarkCss") as HTMLLinkElement;
    if (esriDarkCss) {

      headTag.removeChild(esriDarkCss)
    }
    else {
      let newLink1 = document.createElement("link");
      newLink1.rel = "stylesheet";
      newLink1.type = "text/css";
      newLink1.id = "esriDarkCss";

        if ((environment as any).esriMapUrlDomain && (environment as any).esriMapUrlPath) {
            newLink1.href = (environment as any).esriMapUrlDomain + (environment as any).esriMapCssUrlPath;
        }
        else {
            newLink1.href = "https://js.arcgis.com/4.18/esri/themes/light/main.css";
        }
        
      headTag.appendChild(newLink1);

    }
  }

  modifySidebarUrls(nav, selectedLayoutName: string) {
    nav.forEach(item => {
      if (item.state && item.state.indexOf("sessions") !== -1) {
        return;
      }
      if (item.type === "link" && item.state.indexOf("applayout-") === -1) {
        item.state = "/" + selectedLayoutName + item.state;
      } else if (item.type === "link") {
        item.state = this.replaceUrlString(selectedLayoutName, item.state);
      }
      if (item.type === "dropDown" && item.sub) {
        this.modifySidebarUrls(item.sub, selectedLayoutName);
      }
    });
  }
  replaceUrlString(inputString, fullString) {
    let currentRoute = fullString;
    let routeArray = currentRoute.split("/");

    routeArray = routeArray.map(r => {
      if (r.indexOf("applayout-") !== -1) {
        return inputString;
      }
      return r;
    });
    return routeArray.join("/");
  }

  removeClass(el, className) {
    if (!el || el.length === 0) return;
    if (!el.length) {
      el.classList.remove(className);
    } else {
      for (var i = 0; i < el.length; i++) {
        el[i].classList.remove(className);
      }
    }
  }
  addClass(el, className) {
    if (!el) return;
    if (!el.length) {
      el.classList.add(className);
    } else {
      for (var i = 0; i < el.length; i++) {
        el[i].classList.add(className);
      }
    }
  }
  findClosest(el, className) {
    if (!el) return;
    while (el) {
      var parent = el.parentElement;
      if (parent && this.hasClass(parent, className)) {
        return parent;
      }
      el = parent;
    }
  }
  hasClass(el, className) {
    if (!el) return;
    return (
      ` ${el.className} `.replace(/[\n\t]/g, " ").indexOf(` ${className} `) > -1
    );
  }
  toggleClass(el, className) {
    if (!el) return;
    if (this.hasClass(el, className)) {
      this.removeClass(el, className);
    } else {
      this.addClass(el, className);
    }
  }
  toggleDir(isRTL) {
    let html = document.getElementsByTagName('html')[0];
    if (!html) {
      return;
    }
    if (isRTL) {
      html.setAttribute('dir', 'rtl');
      this.useLanguage('ar');
      localStorage.setItem('lang', 'ar')
    } else {
      html.setAttribute('dir', 'ltr');
      this.useLanguage('en');
      localStorage.setItem('lang', 'en')
    }
    let lang = isRTL ? 'ar' : 'en'
    //this.changeCssFile(lang); //aziz
  }
  // changeTheme(themes: any[], themeName: string) {
  //   themes.forEach(theme => {
  //     this.removeClass(document.body, theme.name);
  //   });
  //   this.addClass(document.body, themeName);
  // }

  useLanguage(lang: string): void {
    this.translateService.setDefaultLang(lang);
  }

  toggleMode() {
    this._isDarkMode = !this._isDarkMode;
    this.changeCssFile();
  }



}
