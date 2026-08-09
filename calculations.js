const Calc = {

    /*
     * Calculate attendance percentage.
     *
     * Example:
     * 18 attended / 22 total = 81.81%
     */
    percentage(present, total) {

        if (total === 0) {
            return 0;
        }

        return (present / total) * 100;
    },


    /*
     * Get complete attendance statistics.
     */
    stats(records) {

        const total = records.length;

        const present =
            records.filter(
                record =>
                    record.status === "present"
            ).length;

        const absent =
            total - present;

        const percentage =
            this.percentage(
                present,
                total
            );

        return {
            present,
            absent,
            total,
            percentage
        };
    },


    /*
     * Calculate how many consecutive classes
     * the student can miss while remaining
     * at or above their target percentage.
     *
     * Example:
     *
     * 18 / 22
     * Target = 75%
     *
     * 18 / 23 = 78.26%
     * 18 / 24 = 75%
     * 18 / 25 = 72%
     *
     * Therefore:
     * Can miss = 2
     */
    canMiss(
        present,
        total,
        target
    ) {

        if (total === 0) {
            return 0;
        }

        let misses = 0;

        while (
            this.percentage(
                present,
                total + misses + 1
            ) >= target
        ) {

            misses++;
        }

        return misses;
    },


    /*
     * Calculate how many consecutive classes
     * must be attended to reach the target.
     *
     * Example:
     *
     * 11 / 17 = 64.7%
     * Target = 75%
     *
     * Find the smallest n where:
     *
     * (11 + n) / (17 + n) >= 75%
     */
    needToRecover(
        present,
        total,
        target
    ) {

        if (
            this.percentage(
                present,
                total
            ) >= target
        ) {

            return 0;
        }

        let classesNeeded = 0;

        while (
            this.percentage(
                present + classesNeeded,
                total + classesNeeded
            ) < target
        ) {

            classesNeeded++;
        }

        return classesNeeded;
    },


    /*
     * Determine attendance status.
     *
     * Safe:
     * 5+ percentage points above target
     *
     * At Risk:
     * Between target and target + 5
     *
     * Below Target:
     * Below target
     */
    status(
        percentage,
        target
    ) {

        if (
            percentage < target
        ) {

            return {
                label: "Below Target",
                className: "danger"
            };
        }


        if (
            percentage < target + 5
        ) {

            return {
                label: "At Risk",
                className: "warn"
            };
        }


        return {
            label: "Safe",
            className: "good"
        };
    },


    /*
     * Format percentages nicely.
     *
     * 82.0000 → "82%"
     * 81.8181 → "81.8%"
     */
    formatPercentage(
        percentage
    ) {

        if (
            Number.isInteger(
                percentage
            )
        ) {

            return `${percentage}%`;
        }

        return `${percentage.toFixed(1)}%`;
    }

};