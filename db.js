const DB = (() => {
    const DB_NAME = "present-db";
    const DB_VERSION = 1;

    let database = null;

    function openDatabase() {
        return new Promise((resolve, reject) => {

            const request = indexedDB.open(
                DB_NAME,
                DB_VERSION
            );

            request.onupgradeneeded = (event) => {

                const db = event.target.result;

                /* =========================
                   SEMESTERS
                ========================= */

                if (!db.objectStoreNames.contains("semesters")) {

                    db.createObjectStore(
                        "semesters",
                        {
                            keyPath: "id"
                        }
                    );
                }

                /* =========================
                   SUBJECTS
                ========================= */

                if (!db.objectStoreNames.contains("subjects")) {

                    const subjects =
                        db.createObjectStore(
                            "subjects",
                            {
                                keyPath: "id"
                            }
                        );

                    subjects.createIndex(
                        "semesterId",
                        "semesterId",
                        {
                            unique: false
                        }
                    );
                }

                /* =========================
                   ATTENDANCE
                ========================= */

                if (!db.objectStoreNames.contains("attendance")) {

                    const attendance =
                        db.createObjectStore(
                            "attendance",
                            {
                                keyPath: "id"
                            }
                        );

                    attendance.createIndex(
                        "subjectId",
                        "subjectId",
                        {
                            unique: false
                        }
                    );

                    attendance.createIndex(
                        "date",
                        "date",
                        {
                            unique: false
                        }
                    );
                }
            };

            request.onsuccess = (event) => {

                database =
                    event.target.result;

                resolve(database);
            };

            request.onerror = () => {

                reject(
                    request.error
                );
            };
        });
    }


    /* =========================
       INITIALIZE DATABASE
    ========================= */

    async function init() {

        if (!database) {

            await openDatabase();
        }

        return database;
    }


    /* =========================
       GET OBJECT STORE
    ========================= */

    function store(
        storeName,
        mode = "readonly"
    ) {

        const transaction =
            database.transaction(
                storeName,
                mode
            );

        return transaction.objectStore(
            storeName
        );
    }


    /* =========================
       GET ALL
    ========================= */

    function getAll(storeName) {

        return new Promise(
            (resolve, reject) => {

                const request =
                    store(storeName)
                        .getAll();

                request.onsuccess = () => {

                    resolve(
                        request.result
                    );
                };

                request.onerror = () => {

                    reject(
                        request.error
                    );
                };
            }
        );
    }


    /* =========================
       GET ONE
    ========================= */

    function get(
        storeName,
        id
    ) {

        return new Promise(
            (resolve, reject) => {

                const request =
                    store(storeName)
                        .get(id);

                request.onsuccess = () => {

                    resolve(
                        request.result
                    );
                };

                request.onerror = () => {

                    reject(
                        request.error
                    );
                };
            }
        );
    }


    /* =========================
       SAVE / UPDATE
    ========================= */

    function put(
        storeName,
        data
    ) {

        return new Promise(
            (resolve, reject) => {

                const request =
                    store(
                        storeName,
                        "readwrite"
                    ).put(data);

                request.onsuccess = () => {

                    resolve(data);
                };

                request.onerror = () => {

                    reject(
                        request.error
                    );
                };
            }
        );
    }


    /* =========================
       DELETE
    ========================= */

    function remove(
        storeName,
        id
    ) {

        return new Promise(
            (resolve, reject) => {

                const request =
                    store(
                        storeName,
                        "readwrite"
                    ).delete(id);

                request.onsuccess = () => {

                    resolve();
                };

                request.onerror = () => {

                    reject(
                        request.error
                    );
                };
            }
        );
    }


    /* =========================
       CLEAR STORE
    ========================= */

    function clear(
        storeName
    ) {

        return new Promise(
            (resolve, reject) => {

                const request =
                    store(
                        storeName,
                        "readwrite"
                    ).clear();

                request.onsuccess = () => {

                    resolve();
                };

                request.onerror = () => {

                    reject(
                        request.error
                    );
                };
            }
        );
    }


    /* =========================
       DELETE EVERYTHING
    ========================= */

    async function clearAll() {

        await clear("attendance");

        await clear("subjects");

        await clear("semesters");
    }


    /* =========================
       EXPORT DATABASE
    ========================= */

    async function exportData() {

        const semesters =
            await getAll("semesters");

        const subjects =
            await getAll("subjects");

        const attendance =
            await getAll("attendance");

        return {
            version: 1,

            exportedAt:
                new Date().toISOString(),

            semesters,

            subjects,

            attendance
        };
    }


    /* =========================
       IMPORT DATABASE
    ========================= */

    async function importData(
        data
    ) {

        if (
            !data ||
            !Array.isArray(
                data.semesters
            ) ||
            !Array.isArray(
                data.subjects
            ) ||
            !Array.isArray(
                data.attendance
            )
        ) {

            throw new Error(
                "Invalid backup file"
            );
        }


        await clearAll();


        for (
            const semester
            of data.semesters
        ) {

            await put(
                "semesters",
                semester
            );
        }


        for (
            const subject
            of data.subjects
        ) {

            await put(
                "subjects",
                subject
            );
        }


        for (
            const record
            of data.attendance
        ) {

            await put(
                "attendance",
                record
            );
        }
    }


    /* =========================
       RETURN PUBLIC API
    ========================= */

    return {

        init,

        getAll,

        get,

        put,

        remove,

        clear,

        clearAll,

        exportData,

        importData
    };

})();