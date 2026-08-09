const app = document.getElementById("app");

let semesters = [];
let subjects = [];
let attendance = [];

let currentSemesterId = null;
let currentSubjectId = null;


/* =========================
   HELPERS
========================= */

function id() {
    return Date.now().toString(36) +
        Math.random().toString(36).substring(2);
}

function today() {
    return new Date().toISOString().split("T")[0];
}

function percent(present, total) {
    if (total === 0) return 0;
    return (present / total) * 100;
}

function recordsForSubject(subjectId) {
    return attendance.filter(
        item => item.subjectId === subjectId
    );
}

function statsForSubject(subjectId) {

    const records = recordsForSubject(subjectId);

    const present = records.filter(
        item => item.status === "present"
    ).length;

    const total = records.length;

    return {
        present,
        total,
        absent: total - present,
        percentage: percent(present, total)
    };
}

function subjectName(subjectId) {

    const subject = subjects.find(
        item => item.id === subjectId
    );

    return subject ? subject.name : "Unknown";
}

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =========================
   LOAD DATA
========================= */

async function loadData() {

    await DB.init();

    semesters = await DB.getAll("semesters");
    subjects = await DB.getAll("subjects");
    attendance = await DB.getAll("attendance");

    if (!currentSemesterId && semesters.length) {
        currentSemesterId = semesters[0].id;
    }
}


/* =========================
   SAVE
========================= */

async function saveSemester(semester) {

    await DB.put(
        "semesters",
        semester
    );

    await loadData();
}

async function saveSubject(subject) {

    await DB.put(
        "subjects",
        subject
    );

    await loadData();
}

async function saveAttendance(record) {

    await DB.put(
        "attendance",
        record
    );

    await loadData();
}


/* =========================
   HOME SCREEN
========================= */

function showHome() {

    if (semesters.length === 0) {
        showSetup();
        return;
    }

    const semester = semesters.find(
        item => item.id === currentSemesterId
    );

    if (!semester) {
        currentSemesterId = semesters[0].id;
        showHome();
        return;
    }

    const semesterSubjects = subjects.filter(
        item =>
            item.semesterId === semester.id
    );

    app.innerHTML = `

        <div class="shell">

            <header class="top">

                <div>
                    <div class="brand">
                        Present
                    </div>

                    <div class="subtitle">
                        Attendance Tracker
                    </div>
                </div>

                <button
                    class="icon-btn"
                    id="settingsBtn"
                >
                    ⚙️
                </button>

            </header>


            <div class="card">

                <div class="row">

                    <div>
                        <div class="muted">
                            Current Semester
                        </div>

                        <h2>
                            ${escapeHTML(semester.name)}
                        </h2>
                    </div>

                    <button
                        class="secondary"
                        id="changeSemesterBtn"
                    >
                        Change
                    </button>

                </div>

            </div>


            <div class="hero">

                <div class="muted">
                    Overall Attendance
                </div>

                <div class="percent">
                    ${overallPercentage(semester.id).toFixed(1)}%
                </div>

                <div class="progress">

                    <i
                        style="
                            width:
                            ${Math.min(
                                100,
                                overallPercentage(
                                    semester.id
                                )
                            )}%
                        "
                    ></i>

                </div>

                <div class="row">

                    <span>
                        ${overallPresent(semester.id)}
                        Present
                    </span>

                    <span>
                        ${overallTotal(semester.id)}
                        Total
                    </span>

                </div>

            </div>


            <div class="row">

                <h2>
                    Subjects
                </h2>

                <button
                    class="secondary"
                    id="addSubjectBtn"
                >
                    + Subject
                </button>

            </div>


            <div class="grid">

                ${
                    semesterSubjects.length === 0

                    ?

                    `
                    <div
                        class="card empty"
                        style="grid-column:1/-1"
                    >

                        <div class="empty-icon">
                            📚
                        </div>

                        <h3>
                            No subjects yet
                        </h3>

                        <p class="muted">
                            Add your first subject
                            to start tracking attendance.
                        </p>

                    </div>
                    `

                    :

                    semesterSubjects.map(
                        subject => {

                            const stats =
                                statsForSubject(
                                    subject.id
                                );

                            const colour =
                                stats.percentage >=
                                subject.targetPercentage
                                    ? "good"
                                    : "danger";

                            return `

                                <button
                                    class="subject"
                                    data-subject-id="${subject.id}"
                                >

                                    <h3>
                                        ${escapeHTML(
                                            subject.name
                                        )}
                                    </h3>

                                    <div
                                        class="
                                            subject-percent
                                            ${colour}
                                        "
                                    >
                                        ${
                                            stats.percentage
                                                .toFixed(1)
                                        }%
                                    </div>

                                    <div class="muted">
                                        ${
                                            stats.present
                                        } /
                                        ${
                                            stats.total
                                        } classes
                                    </div>

                                </button>

                            `;
                        }
                    ).join("")
                }

            </div>


            <button
                class="fab"
                id="quickAttendanceBtn"
            >
                +
            </button>

        </div>
    `;


    document
        .getElementById("settingsBtn")
        .onclick = showSettings;


    document
        .getElementById("changeSemesterBtn")
        .onclick = showSemesterPicker;


    document
        .getElementById("addSubjectBtn")
        .onclick = showAddSubject;


    document
        .getElementById("quickAttendanceBtn")
        .onclick = showAttendance;


    document
        .querySelectorAll("[data-subject-id]")
        .forEach(button => {

            button.onclick = () => {

                currentSubjectId =
                    button.dataset.subjectId;

                showSubject();

            };

        });
}


/* =========================
   OVERALL STATS
========================= */

function semesterRecords(semesterId) {

    const semesterSubjects =
        subjects.filter(
            item =>
                item.semesterId === semesterId
        );

    return attendance.filter(
        record =>
            semesterSubjects.some(
                subject =>
                    subject.id === record.subjectId
            )
    );
}

function overallPresent(semesterId) {

    return semesterRecords(
        semesterId
    ).filter(
        item =>
            item.status === "present"
    ).length;
}

function overallTotal(semesterId) {

    return semesterRecords(
        semesterId
    ).length;
}

function overallPercentage(semesterId) {

    return percent(
        overallPresent(semesterId),
        overallTotal(semesterId)
    );
}


/* =========================
   FIRST SETUP
========================= */

function showSetup() {

    app.innerHTML = `

        <div class="shell">

            <div
                class="card empty"
                style="margin-top:40px"
            >

                <div class="empty-icon">
                    ✓
                </div>

                <h1>
                    Welcome to Present
                </h1>

                <p class="muted">
                    Your simple attendance tracker.
                </p>

                <button
                    class="primary"
                    id="createSemesterBtn"
                >
                    Create Semester
                </button>

            </div>

        </div>
    `;

    document
        .getElementById("createSemesterBtn")
        .onclick = showAddSemester;
}


/* =========================
   ADD SEMESTER
========================= */

function showAddSemester() {

    app.innerHTML = `

        <div class="shell">

            <button
                class="back"
                id="backBtn"
            >
                ← Back
            </button>

            <div class="card">

                <h1>
                    Create Semester
                </h1>

                <div class="field">

                    <label>
                        Semester / Class
                    </label>

                    <input
                        id="semesterName"
                        placeholder="B.Tech CSE - Semester 5"
                    >

                </div>

                <div class="field">

                    <label>
                        Academic Year
                    </label>

                    <input
                        id="academicYear"
                        placeholder="2026-27"
                    >

                </div>

                <div class="field">

                    <label>
                        Target Attendance %
                    </label>

                    <input
                        id="target"
                        type="number"
                        value="75"
                        min="1"
                        max="100"
                    >

                </div>

                <button
                    class="primary"
                    id="saveSemesterBtn"
                >
                    Create Semester
                </button>

            </div>

        </div>
    `;


    document
        .getElementById("backBtn")
        .onclick = showHome;


    document
        .getElementById("saveSemesterBtn")
        .onclick = async () => {

            const name =
                document
                    .getElementById("semesterName")
                    .value
                    .trim();

            const academicYear =
                document
                    .getElementById("academicYear")
                    .value
                    .trim();

            const target =
                Number(
                    document
                        .getElementById("target")
                        .value
                );


            if (!name) {
                alert("Enter a semester name.");
                return;
            }


            const semester = {

                id: id(),

                name,

                academicYear,

                targetPercentage:
                    target || 75,

                createdAt:
                    Date.now()

            };


            await saveSemester(
                semester
            );


            currentSemesterId =
                semester.id;


            showHome();
        };
}


/* =========================
   ADD SUBJECT
========================= */

function showAddSubject() {

    app.innerHTML = `

        <div class="shell">

            <button
                class="back"
                id="backBtn"
            >
                ← Back
            </button>

            <div class="card">

                <h1>
                    Add Subject
                </h1>

                <div class="field">

                    <label>
                        Subject Name
                    </label>

                    <input
                        id="subjectName"
                        placeholder="Artificial Intelligence"
                    >

                </div>

                <div class="field">

                    <label>
                        Subject Code
                    </label>

                    <input
                        id="subjectCode"
                        placeholder="AI"
                    >

                </div>

                <div class="field">

                    <label>
                        Target Attendance %
                    </label>

                    <input
                        id="subjectTarget"
                        type="number"
                        value="75"
                        min="1"
                        max="100"
                    >

                </div>

                <button
                    class="primary"
                    id="saveSubjectBtn"
                >
                    Add Subject
                </button>

            </div>

        </div>
    `;


    document
        .getElementById("backBtn")
        .onclick = showHome;


    document
        .getElementById("saveSubjectBtn")
        .onclick = async () => {

            const name =
                document
                    .getElementById("subjectName")
                    .value
                    .trim();

            const code =
                document
                    .getElementById("subjectCode")
                    .value
                    .trim();

            const target =
                Number(
                    document
                        .getElementById("subjectTarget")
                        .value
                );


            if (!name) {
                alert("Enter a subject name.");
                return;
            }


            const subject = {

                id: id(),

                semesterId:
                    currentSemesterId,

                name,

                code,

                targetPercentage:
                    target || 75,

                createdAt:
                    Date.now()

            };


            await saveSubject(
                subject
            );


            currentSubjectId =
                subject.id;


            showSubject();
        };
}


/* =========================
   SUBJECT PAGE
========================= */

function showSubject() {

    const subject =
        subjects.find(
            item =>
                item.id ===
                currentSubjectId
        );


    if (!subject) {
        showHome();
        return;
    }


    const stats =
        statsForSubject(
            subject.id
        );


    const target =
        Number(
            subject.targetPercentage
        ) || 75;


    const percentage =
        stats.percentage;


    let advice = "";


    if (percentage >= target) {

        let misses = 0;

        while (
            percent(
                stats.present,
                stats.total + misses + 1
            ) >= target
        ) {
            misses++;
        }


        advice = `

            <div class="card">

                <h3>
                    Can I miss?
                </h3>

                <p>

                    You can miss

                    <strong>
                        ${misses}
                    </strong>

                    more class
                    ${misses === 1 ? "" : "es"}

                    and remain at or above
                    ${target}%.

                </p>

            </div>
        `;

    } else {

        let needed = 0;

        while (
            percent(
                stats.present + needed,
                stats.total + needed
            ) < target
        ) {
            needed++;
        }


        advice = `

            <div class="card">

                <h3>
                    Recovery
                </h3>

                <p>

                    You need to attend the
                    next

                    <strong>
                        ${needed}
                    </strong>

                    class
                    ${needed === 1 ? "" : "es"}

                    to reach ${target}%.

                </p>

            </div>
        `;
    }


    app.innerHTML = `

        <div class="shell">

            <button
                class="back"
                id="backBtn"
            >
                ← Back
            </button>


            <div class="hero">

                <div class="muted">
                    ${escapeHTML(subject.name)}
                </div>

                <div class="percent">
                    ${percentage.toFixed(1)}%
                </div>

                <div class="progress">

                    <i
                        style="
                            width:
                            ${Math.min(
                                100,
                                percentage
                            )}%
                        "
                    ></i>

                </div>

                <div class="row">

                    <span>
                        ${stats.present} Present
                    </span>

                    <span>
                        ${stats.absent} Absent
                    </span>

                </div>

            </div>


            <div class="card">

                <h3>
                    Attendance
                </h3>

                <p class="muted">

                    ${stats.present}
                    attended out of
                    ${stats.total}
                    classes.

                </p>

                <p class="muted">

                    Target:
                    ${target}%

                </p>

            </div>


            ${advice}


            <button
                class="primary"
                id="markAttendanceBtn"
            >
                + Mark Attendance
            </button>


            <div
                class="spacer"
            ></div>


            <button
                class="secondary"
                style="width:100%"
                id="historyBtn"
            >
                View Attendance History
            </button>


            <div
                class="spacer"
            ></div>


            <button
                class="danger-btn"
                style="width:100%"
                id="deleteSubjectBtn"
            >
                Delete Subject
            </button>

        </div>
    `;


    document
        .getElementById("backBtn")
        .onclick = showHome;


    document
        .getElementById("markAttendanceBtn")
        .onclick = showAttendance;


    document
        .getElementById("historyBtn")
        .onclick = showHistory;


    document
        .getElementById("deleteSubjectBtn")
        .onclick =
            deleteCurrentSubject;
}


/* =========================
   MARK ATTENDANCE
========================= */

function showAttendance() {

    const semesterSubjects =
        subjects.filter(
            item =>
                item.semesterId ===
                currentSemesterId
        );


    app.innerHTML = `

        <div class="shell">

            <button
                class="back"
                id="backBtn"
            >
                ← Back
            </button>


            <div class="card">

                <h1>
                    Mark Attendance
                </h1>

                <p class="muted">
                    Select the subject and mark
                    today's class.
                </p>


                <div class="field">

                    <label>
                        Subject
                    </label>

                    <select
                        id="attendanceSubject"
                    >

                        ${semesterSubjects.map(
                            subject => `

                                <option
                                    value="${subject.id}"
                                    ${
                                        subject.id ===
                                        currentSubjectId
                                            ? "selected"
                                            : ""
                                    }
                                >
                                    ${escapeHTML(
                                        subject.name
                                    )}
                                </option>

                            `
                        ).join("")}

                    </select>

                </div>


                <div class="field">

                    <label>
                        Date
                    </label>

                    <input
                        id="attendanceDate"
                        type="date"
                        value="${today()}"
                    >

                </div>


                <div class="spacer"></div>


                <button
                    class="primary"
                    id="presentBtn"
                    style="
                        padding:20px;
                        font-size:18px;
                    "
                >
                    ✓ PRESENT
                </button>


                <div class="spacer"></div>


                <button
                    class="danger-btn"
                    id="absentBtn"
                    style="
                        width:100%;
                        padding:20px;
                        font-size:18px;
                    "
                >
                    ✕ ABSENT
                </button>

            </div>

        </div>
    `;


    document
        .getElementById("backBtn")
        .onclick = () => {

            if (currentSubjectId) {
                showSubject();
            } else {
                showHome();
            }

        };


    async function mark(status) {

        const subjectId =
            document
                .getElementById(
                    "attendanceSubject"
                )
                .value;


        const date =
            document
                .getElementById(
                    "attendanceDate"
                )
                .value;


        const record = {

            id: id(),

            subjectId,

            date,

            status,

            createdAt:
                Date.now()

        };


        await saveAttendance(
            record
        );


        currentSubjectId =
            subjectId;


        showSubject();
    }


    document
        .getElementById("presentBtn")
        .onclick = () =>
            mark("present");


    document
        .getElementById("absentBtn")
        .onclick = () =>
            mark("absent");
}


/* =========================
   HISTORY
========================= */

function showHistory() {

    const records =
        recordsForSubject(
            currentSubjectId
        ).sort(
            (a, b) =>
                b.date.localeCompare(
                    a.date
                )
        );


    const subject =
        subjects.find(
            item =>
                item.id ===
                currentSubjectId
        );


    app.innerHTML = `

        <div class="shell">

            <button
                class="back"
                id="backBtn"
            >
                ← Back
            </button>

            <h1>
                Attendance History
            </h1>

            <p class="muted">
                ${escapeHTML(subject.name)}
            </p>


            ${
                records.length === 0

                ?

                `
                <div class="card empty">

                    <div class="empty-icon">
                        📅
                    </div>

                    <h3>
                        No attendance yet
                    </h3>

                    <p class="muted">
                        Mark your first class.
                    </p>

                </div>
                `

                :

                records.map(
                    record => `

                        <div class="card">

                            <div class="row">

                                <div>

                                    <strong>
                                        ${record.date}
                                    </strong>

                                    <div
                                        class="
                                            ${
                                                record.status ===
                                                "present"
                                                    ? "good"
                                                    : "danger"
                                            }
                                        "
                                    >

                                        ${
                                            record.status ===
                                            "present"
                                                ? "✓ Present"
                                                : "✕ Absent"
                                        }

                                    </div>

                                </div>

                                <button
                                    class="danger-btn"
                                    data-delete-id="${record.id}"
                                >
                                    Delete
                                </button>

                            </div>

                        </div>

                    `
                ).join("")
            }

        </div>
    `;


    document
        .getElementById("backBtn")
        .onclick = showSubject;


    document
        .querySelectorAll(
            "[data-delete-id]"
        )
        .forEach(button => {

            button.onclick = async () => {

                await DB.remove(
                    "attendance",
                    button.dataset.deleteId
                );

                await loadData();

                showHistory();
            };

        });
}


/* =========================
   SEMESTER PICKER
========================= */

function showSemesterPicker() {

    app.innerHTML = `

        <div class="shell">

            <button
                class="back"
                id="backBtn"
            >
                ← Back
            </button>

            <h1>
                Semesters
            </h1>

            ${
                semesters.map(
                    semester => `

                        <button
                            class="subject"
                            style="
                                width:100%;
                                margin-bottom:10px;
                            "
                            data-semester-id="${semester.id}"
                        >

                            <h3>
                                ${escapeHTML(
                                    semester.name
                                )}
                            </h3>

                            <div class="muted">

                                ${
                                    semester.academicYear ||
                                    ""
                                }

                                · Target
                                ${
                                    semester.targetPercentage
                                }%

                            </div>

                        </button>

                    `
                ).join("")
            }


            <button
                class="primary"
                id="newSemesterBtn"
            >
                + New Semester
            </button>

        </div>
    `;


    document
        .getElementById("backBtn")
        .onclick = showHome;


    document
        .getElementById("newSemesterBtn")
        .onclick = showAddSemester;


    document
        .querySelectorAll(
            "[data-semester-id]"
        )
        .forEach(button => {

            button.onclick = () => {

                currentSemesterId =
                    button.dataset.semesterId;

                currentSubjectId =
                    null;

                showHome();
            };

        });
}


/* =========================
   SETTINGS
========================= */

function showSettings() {

    app.innerHTML = `

        <div class="shell">

            <button
                class="back"
                id="backBtn"
            >
                ← Back
            </button>


            <h1>
                Settings
            </h1>


            <div class="card">

                <h3>
                    Data
                </h3>

                <p class="muted">
                    Your attendance is stored
                    locally on this device.
                </p>


                <button
                    class="secondary"
                    style="width:100%"
                    id="exportBtn"
                >
                    Export Backup
                </button>

            </div>


            <div class="card">

                <h3>
                    Danger Zone
                </h3>

                <button
                    class="danger-btn"
                    style="width:100%"
                    id="deleteAllBtn"
                >
                    Delete All Data
                </button>

            </div>

        </div>
    `;


    document
        .getElementById("backBtn")
        .onclick = showHome;


    document
        .getElementById("exportBtn")
        .onclick = exportBackup;


    document
        .getElementById("deleteAllBtn")
        .onclick = deleteAllData;
}


/* =========================
   EXPORT BACKUP
========================= */

async function exportBackup() {

    const data = {

        version: 1,

        semesters,

        subjects,

        attendance,

        exportedAt:
            new Date().toISOString()

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const link =
        document.createElement(
            "a"
        );


    link.href = url;

    link.download =
        "present-backup.json";


    link.click();


    URL.revokeObjectURL(url);
}


/* =========================
   DELETE SUBJECT
========================= */

async function deleteCurrentSubject() {

    const subject =
        subjects.find(
            item =>
                item.id ===
                currentSubjectId
        );


    if (!subject) return;


    const confirmed =
        confirm(
            `Delete ${subject.name} and its attendance?`
        );


    if (!confirmed) return;


    const records =
        recordsForSubject(
            subject.id
        );


    for (const record of records) {

        await DB.remove(
            "attendance",
            record.id
        );
    }


    await DB.remove(
        "subjects",
        subject.id
    );


    await loadData();


    currentSubjectId =
        null;


    showHome();
}


/* =========================
   DELETE EVERYTHING
========================= */

async function deleteAllData() {

    const confirmed =
        confirm(
            "Delete ALL semesters, subjects and attendance?"
        );


    if (!confirmed) return;


    await DB.clearAll();


    semesters = [];

    subjects = [];

    attendance = [];

    currentSemesterId =
        null;

    currentSubjectId =
        null;


    showSetup();
}


/* =========================
   START APP
========================= */

async function startApp() {

    try {

        await loadData();

        showHome();

    } catch (error) {

        console.error(
            "Present error:",
            error
        );

        app.innerHTML = `

            <div class="shell">

                <div class="card empty">

                    <div class="empty-icon">
                        ⚠️
                    </div>

                    <h2>
                        Something went wrong
                    </h2>

                    <p class="muted">
                        Open the browser console
                        to see the error.
                    </p>

                </div>

            </div>
        `;
    }
}

startApp();