import { id } from "@instantdb/react";
import db from "./instant";

/**
 * Migration to convert habitTracks to the new model of separate habits and completions
 */
export async function migrateHabitData() {
    // Fetch all existing habitTracks
    const { habitTracks = [], habits = [] } = await db.query({
        habitTracks: {},
        habits: {}
    });

    // Skip if we don't have any habitTracks or if we already have habits
    if (habitTracks.length === 0 || habits.length > 0) {
        console.log("No migration needed for habit data");
        return;
    }

    console.log(`Migrating ${habitTracks.length} habit tracks to new model...`);

    // Get unique habit names
    const uniqueHabitNames = Array.from(new Set(habitTracks.map(track => track.habitName)));

    // Create a map to store habitId by name
    const habitIdsByName = new Map();

    // Create habits
    const habitsCreationPromises = uniqueHabitNames.map(async (name) => {
        const newHabitId = id();
        habitIdsByName.set(name, newHabitId);

        return db.transact(
            db.tx.habits[newHabitId].update({
                name,
                createdAt: new Date().toISOString()
            })
        );
    });

    await Promise.all(habitsCreationPromises);

    // Create completions
    const completionsCreationPromises = habitTracks.map(async (track) => {
        const habitId = habitIdsByName.get(track.habitName);
        if (!habitId) {
            console.error(`Could not find habit ID for name: ${track.habitName}`);
            return;
        }

        const completionId = id();
        return db.transact(
            db.tx.habitCompletions[completionId].update({
                habitId,
                date: track.date,
                completed: track.completed,
                notes: track.notes || "",
                createdAt: track.createdAt
            })
        );
    });

    await Promise.all(completionsCreationPromises);

    console.log(`Migration completed: Created ${uniqueHabitNames.length} habits and ${habitTracks.length} completions`);

    // Optionally, if you want to delete old habitTracks:
    // Uncomment this to delete old data once migration is successful
    /*
    const deletePromises = habitTracks.map(track => 
      db.transact(db.tx.habitTracks[track.id].delete())
    );
    await Promise.all(deletePromises);
    console.log(`Deleted ${habitTracks.length} old habit tracks`);
    */
} 