let defaultRoutes = {
	"policy": "/{lng}/policy",
	"terms": "/{lng}/terms",
	"error404": "/404"
};

function getCurrentRoute() {
  const path = window.location.pathname;
  return Object.keys(defaultRoutes).find(key => {
    const pattern = '^' + defaultRoutes[key].replace('{lng}', '[a-z]{2}') + '$';
    return new RegExp(pattern).test(path);
  }) || null;
}

function getCurrentLanguage() {
	return document.documentElement.lang;	
}

function addHomeRedirect() {
  const homeBalise = document.getElementById('index');
  if (homeBalise) {
    homeBalise.addEventListener('click', function() {
		sessionStorage.clear();
        window.location.href = `/${getCurrentLanguage()}`;
    });
  }
}

function switchLanguage(url) {
    try {
        const urlObj = new URL(url, window.location.origin);
        urlObj.pathname = urlObj.pathname.replace(/^\/(fr|en)/, (match) => {
            return match === '/fr' ? '/en' : '/fr';
        });
        const currentHash = sessionStorage.getItem('currentHash');
        if (currentHash && /^[a-zA-Z0-9-_]+$/.test(currentHash)) {
            urlObj.hash = `#${currentHash}`;
        } else {
            urlObj.hash = '';
        }
        return urlObj.pathname + urlObj.search + urlObj.hash;
    } catch (error) {
        return '/';
    }
}

function initTranslator() {
	const toggle = document.getElementById('language-toggle');
	if(toggle){
		toggle.checked = getCurrentLanguage() == 'fr';
		toggle.addEventListener('change', function () {
			toggle.checked = getCurrentLanguage() == 'fr';
			const newUrl = switchLanguage(window.location.href);
			if (/^\/(?!\/)/.test(newUrl)) {
				window.location.href = newUrl;
			}
		});
	}
}

function initPage(){
	const idPage = getCurrentRoute();
	initTranslator();
	addHomeRedirect();
}