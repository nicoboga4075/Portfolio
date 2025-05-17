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
    var newUrl = url;
    if (url.includes('/fr')) {
        newUrl = url.replace('/fr', '/en');
    } else if (url.includes('/en')) {
        newUrl = url.replace('/en', '/fr');
    }
	const currentHash = sessionStorage.getItem('currentHash');
	if(currentHash){
		newUrl += `#${currentHash}`; 
	}
    return newUrl;
}

function initTranslator() {
	const toggle = document.getElementById('language-toggle');
	if(toggle){
		toggle.checked = getCurrentLanguage() == 'fr';
		toggle.addEventListener('change', function () {
			toggle.checked = getCurrentLanguage() == 'fr'; // If user comes back in history
			window.location.href = switchLanguage(window.location.href);
		});
	}
}

function initPage(){
	const idPage = getCurrentRoute();
	alert(idPage);
	initTranslator();
	addHomeRedirect();
}