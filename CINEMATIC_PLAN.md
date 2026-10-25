# Chapter cinematic plan

Full Red Sky Archive episodes stay on the title screen rewatch gallery.
A level never plays a 50 to 60 second episode at the start.

Rules the engine enforces:

1. Each in level clip is 8 to 20 seconds, skippable, and returns control right after (movement, a choice, or the objective).
2. Clips map to rooms and objectives. They are not one episode dump per chapter.
3. The gallery may list a full short, or a montage of the openers. Level flow only uses the short beat clips.
4. If a full Ep 1 to Ep 7 file is linked later, the level plays only that beat's cue window. The whole file plays only from PLAY FULL SHORT.
5. Lines are indexes into intro text and radio lines that already exist. No new story prose.
6. After each opener the player gets the controls back. Door stories still run as choices, not as a long video.

No episode URL is filled in. Inventing links would point at the wrong films. Episodes 8 and 9 stay hooks until those full shorts exist.

Cue windows inside one episode do not overlap. `tools/check-cinematics.mjs` checks the caps.

## Episode One, rsa1, ep1

| Clip | When | Cap | Cue | What the player hits |
|---|---|---|---|---|
| ep1_wake | open | 18s | 0 to 17 | In engine awakening. Objective: FIND THE DEAD MAN'S RIFLE. This replaces a second dump of the chapter intro. |
| ep1_street | room 1 | 14s | 17 to 31 | CROSS THE RUINED STREET. Existing lines: gravel and cold, then Reyes, get up. |

## Inside the Hive, rsa2, ch_taken

| Clip | When | Cap | Cue | What the player hits |
|---|---|---|---|---|
| taken_pod | open | 14s | 0 to 14 | Warm light. Ten thousand people breathing. Then the pod gallery. |
| taken_gallery | room 1 | 10s | 14 to 24 | CROSS THE POD GALLERY. The pod seal line. |
| taken_nursery | room 3 | 12s | 24 to 36 | CROSS THE NURSERY. Reyes, far above. |

## The Listening Dark, rsa3, ch_ghost

| Clip | When | Cap | Cue | What the player hits |
|---|---|---|---|---|
| ghost_well | open | 14s | 0 to 14 | The dark under the depot, and the trunk line. |
| ghost_cable | room 3 | 14s | 14 to 28 | CROSS THE CABLE RUN. The radio says MARCUS. |

## The Convoy, rsa4, ch_together

| Clip | When | Cap | Cue | What the player hits |
|---|---|---|---|---|
| convoy_ridge | open | 14s | 0 to 14 | Ridge over the valley road. Pod carriers. |
| convoy_check | room 2 | 10s | 14 to 24 | CLEAR THE CHECKPOINT. Reyes hands over the rifle. |
| convoy_yard | room 3 | 12s | 24 to 36 | CROSS THE STAGING YARD. |

## The Long Road, rsa5, ch_lone

| Clip | When | Cap | Cue | What the player hits |
|---|---|---|---|---|
| road_open | open | 14s | 0 to 14 | Dead highway, then the human pulse. |
| road_toll | room 2 | 12s | 14 to 26 | PASS THE TOLL PLAZA. |
| road_climb | room 3 | 12s | 26 to 38 | CLIMB THE ACCESS ROAD. |

## Counting House, rsa6, ch_counting

| Clip | When | Cap | Cue | What the player hits |
|---|---|---|---|---|
| count_entry | open | 14s | 0 to 14 | Counting House entry. Every copy. The building where names are made permanent. |
| count_hall | room 1 | 14s | 14 to 28 | CROSS THE RECORDS HALL UNSEEN. No rifle. Stay out of the light. |

## The Conduits, rsa7, ch_conduits

| Clip | When | Cap | Cue | What the player hits |
|---|---|---|---|---|
| conduits_brief | open | 18s | 0 to 18 | Riverbed briefing. Forty three, David's count, Omega 7. FOLLOW THE DRY RIVERBED. The Thomas choice comes after control returns. |
| conduits_sweep | room 1 | 10s | 18 to 28 | STAY UNDER THE PERIMETER SWEEPS. |
| conduits_dash | room 2 | 12s | 28 to 40 | MAKE THE FORTY SECOND DASH. Existing line: open ground, forty seconds. |
| conduits_data | room 3 | 14s | 40 to 54 | FOLLOW THE DATA CONDUITS. Stealing minds, and he can read the code. |

## The Harvest, rsa8 hook, ch_harvest

| Clip | When | Cap | Cue | What the player hits |
|---|---|---|---|---|
| harvest_hatch | open | 14s | 0 to 14 | Cathedral of chrome, and Kara's spare rifle at the hatch. |
| harvest_gallery | room 2 | 12s | 14 to 26 | CROSS THE TOWER GALLERY. Blue to amber towers. The Angela choice is the door story before this clip. |
| harvest_floor | room 3 | 10s | 26 to 36 | CROSS THE DEPLETION FLOOR. |

## Fire and Steel, rsa9 hook, ch_steel

| Clip | When | Cap | Cue | What the player hits |
|---|---|---|---|---|
| steel_ridge | open | 16s | 0 to 16 | Ridge before the pass. FOLLOW THOMAS NORTH. Two days north, and what kind of man. The start choice follows after control returns. |
| steel_pass | room 1 | 12s | 16 to 28 | CROSS THE MOUNTAIN PASS. They were losing. |
| steel_yard | room 4 | 12s | 28 to 40 | HOLD THE LABORATORY. The yard before the hunter. The Kara offer (core story) runs after this clip, then the fight. |

## Gallery vs level

- ARCHIVE on the title lists every episode, each beat row, and MONTAGE OF OPENERS.
- PLAY FULL SHORT stays disabled until `url` is set on that episode. The button reads FULL SHORT NOT LINKED.
- In a level, `playClip` stops at `max` (never above 20) and, if a file exists, stops at the end of `cue`.
