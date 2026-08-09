const CACHE_NAME = "present-v1";

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
                    cache.addAll(
                        APP_FILES
                    )
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

        /*
         * Only handle GET requests.
         */

        if (
            event.request.method !==
            "GET"
        ) {

            return;
        }


        event.respondWith(

            caches
                .match(
                    event.request
                )
                .then(cachedResponse => {

                    /*
                     * If the file is already
                     * cached, use it.
                     */

                    if (
                        cachedResponse
                    ) {

                        return cachedResponse;
                    }


                    /*
                     * Otherwise fetch it
                     * from the network.
                     */

                    return fetch(
                        event.request
                    )
                    .then(response => {

                        /*
                         * Save a copy for
                         * future offline use.
                         */

                        if (
                            response &&
                            response.status ===
                                200 &&
                            response.type ===
                                "basic"
                        ) {

                            const copy =
                                response.clone();

                            caches
                                .open(
                                    CACHE_NAME
                                )
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
                         * If there is no internet,
                         * return the cached app.
                         */

                        return caches.match(
                            "./index.html"
                        );

                    });

                })

        );
    }
);