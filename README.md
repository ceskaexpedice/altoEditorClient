# Altoeditorclient

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 16.2.1.


# Instalace a konfigurace

## Instalace
1. Stáhněte zip altoeditorclient.zip_ ze [stránky s releasy](https://github.com/ceskaexpedice/altoEditorClient/releases)
2. Obsah archivu nahrajte do složky, na kterou máte nasměrovaný web server s doménou pro Alto Editor.

## Konfigurace
Ve složce vytvořte složku `shared`, kde budete mít všechny vlastní lokální soubory, zejména:
*  `config.json` - konfigurační soubor

### config.json

V souboru u `/shared/config.json` muzete prepisovat vychozi hodnoty konfiguracniho souboru `/assets/config.json`
1. 

1. **authBaseUrl** url s instalací keycloaku, např. 'https://k7.inovatika.dev/search/api/client/v7.0'
4. **keycloak** konfigurace keycloaku
    2. **loginType** 'form' |  'idp' |  'all'


### Příklad konfigurace

```
{
  "login": "inovatika",
  "instance": "k7",
  "defaultLang": "cs",
  "deployPath": "",
  "authBaseUrl": "https://k7.inovatika.dev/search/api/client/v7.0",
  "keycloak": {
		"loginType": 'form' |  'idp' |  'all',
		"logoutUrl": "/login" 
  }

}

```


## Konfigurace web serveru
Je potřeba přesměrovat všechny requesty na neexistující stránky na stránku /index.html (aplikace se ve skutečnosti skládá pouze z této jediné stránky).

### Apache
V adresáři s aplikací vytvořit soubor .htaccess s následujícím obsahem

```
RewriteEngine On

# If the request is a file, folder or symlink that exists, serve it up
RewriteCond %{REQUEST_FILENAME} -s [OR]
RewriteCond %{REQUEST_FILENAME} -l [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^(.+)$ - [S=1]

# otherwise, serve your index.html app
RewriteRule ^(.+)$ /index.html
```

### Nginx
V /etc/nginx/sites-enabled/default
Přidat do definice serveru:

```
location / {
  try_files $uri $uri/ /index.html;
}
```

Např.
```
server {
  listen 80 default_server;
  listen [::]:80 default_server;
  root /home/kramerius/client;
  index index.html;
  server_name kramerius.example.com;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```
## Build
### Produkční build
`npm run build`

Vytvoří instalační soubory v adresáři _dist_.

### Lokální build
`npm run start`

Spustí _ng serve_ na portu 4321.








