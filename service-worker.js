const CACHE_NAME = "present-v2";

const APP_FILES = [
    "./",
    "./index.html",
    "./styles.css",
    "./db.js",
    "./calculations.js",
    "./app.js",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png"
];


/* =========================
   INSTALL
========================= */

self.addEventListener(
    "install",
    event => {

        event.waitUntil(

            caches
                .open(CACHE_NAME)
                .then(cache =>
                    cache.addAll(APP_FILES)
                )
                .then(() =>
                    self.skipWaiting()
                )

        );

    }
);


/* =========================
   ACTIVATE
========================= */

self.addEventListener(
    "activate",
    event => {

        event.waitUntil(

            caches
                .keys()
                .then(keys =>

                    Promise.all(

                        keys
                            .filter(
                                key =>
                                    key !==
                                    CACHE_NAME
                            )
                            .map(
                                key =>
                                    caches.delete(
                                        key
                                    )
                            )

                    )

                )
                .then(() =>
                    self.clients.claim()
                )

        );

    }
);


/* =========================
   FETCH
========================= */

self.addEventListener(
    "fetch",
    event => {

        if (
            event.request.method !==
            "GET"
        ) {
            return;
        }


        event.respondWith(

            fetch(event.request)

                .then(response => {

                    /*
                     * Get the newest version
                     * from GitHub whenever
                     * internet is available.
                     */

                    if (
                        response &&
                        response.status === 200 &&
                        response.type === "basic"
                    ) {

                        const copy =
                            response.clone();

                        caches
                            .open(CACHE_NAME)
                            .then(cache => {

                                cache.put(
                                    event.request,
                                    copy
                                );

                            });

                    }


                    return response;

                })

                .catch(() => {

                    /*
                     * Offline:
                     * use the cached version.
                     */

                    return caches.match(
                        event.request
                    );

                })

        );

    }
);