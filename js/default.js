const appDefaultRoutes = {
	"policy": "/{lng}/policy",
	"terms": "/{lng}/terms",
	"error404": "/404"
};

function getCurrentRoute() {
  const path = window.location.pathname;
  return Object.keys(appDefaultRoutes).find(key => {
    const pattern = '^' + appDefaultRoutes[key].replace('{lng}', '[a-z]{2}') + '/?$';
    return new RegExp(pattern).test(path);
  }) || 'error404';
}

function getHashFromSession() {
	return sessionStorage.getItem('currentHash');
}

function getCurrentLanguage() {
	return document.documentElement.lang;	
}

function addHomeRedirect() {
  const homeBalise = document.getElementById('index');
  if (homeBalise) {
    homeBalise.href = `/${getCurrentLanguage()}`;
    homeBalise.addEventListener('click', function() {
      sessionStorage.clear();
    });
  }
}

function switchLanguage(url) {
    try {
        const urlObj = new URL(url, window.location.origin);
        urlObj.pathname = urlObj.pathname.replace(/^\/(fr|en)/, (match) => {
            return match === '/fr' ? '/en' : '/fr';
        });
        const currentHash = getHashFromSession();
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
	if (toggle) {
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

function loadImages(selector, extension, one = false) {
  const imgs = document.querySelectorAll(`${selector}`);
  Array.from(imgs).some((el, index) => {
	const locationImg = `images/${el.id}.${extension}`;
	if (el.tagName.toLowerCase() === 'img') {
		el.src = locationImg;
	} else {
		el.style.backgroundImage = `url(${locationImg})`;
	}
    // If first iteration, return true to stop further iteration
    return index === 0 && one;
  });
}

function initArticle() {
	loadImages('.article-image','png');
	loadImages('.icon.svg','svg');
	initTranslator();
	addHomeRedirect();
	document.body.classList.add('read-zone');
}

function initPage() {
	navigator.serviceWorker.register('/service-worker.js', { scope: '/' })
	.then(reg => console.log('Service Worker registered:', reg.scope))
	.catch(err => console.error('Service Worker registration failed:', err));
	loadImages('.icon.svg','svg');
	initTranslator();
	addHomeRedirect();
	const idPage = getCurrentRoute();
	if (idPage in appDefaultRoutes) {
		document.body.classList.add('text-center');
	}
	document.querySelectorAll('a[href="#"]').forEach(link => {
	  link.addEventListener('click', function(event) {
		event.preventDefault();
	  });
	});
}