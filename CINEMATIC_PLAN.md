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

All seven Book One Shorts are linked under `media/shorts/`. Each file is about a minute, so PLAY FULL SHORT is the only control that runs the whole file. A level plays one cue window, 8 to 20 seconds, then returns control. Every chapter open is a game short under `media/shorts/game/`. Episode 9, Fire and Steel, stays a hook on the book row. The Listening Dark is not Episode 7.

| Short | File | Where it plays in a level |
|---|---|---|
| 1. Twenty Feet of Machine | media/shorts/rsa_ep01_720p.mp4 | Gallery only. Episode One levels use the game shorts below, not this file. |
| 2. Forty-Three Left | media/shorts/rsa_ep02_720p.mp4 | Gallery only. The conduits open is the dry riverbed game short, then the Thomas choice. This is not the hive path. |
| 3. They Are Stealing Our Minds | media/shorts/rsa_ep03_720p.mp4 | Gallery only. The cards are the Omega-7 briefing (forty kilometers northwest, systematically depleted, a harvesting facility). That opener is the dry riverbed game short, then the Thomas choice. No second video. |
| 4. The Afternoons | media/shorts/rsa_ep04_720p.mp4 | Tower gallery only, 16 to 32s, blue to amber. This is not the convoy path. |
| 5. Eight Hundred Meters | media/shorts/rsa_ep05_720p.mp4 | Data conduits, 4 to 12s. Forty second dash, 20 to 32s. The sweep room has no card in this file, so that room stays the existing line. The pulse at the end stays the finale choice. |
| 6. Batch | media/shorts/rsa_ep06_720p.mp4 | Depletion floor, 8 to 16s. The open is the core game short, not this file. Angela, the seventy-two hours, and the core voice stay the door stories. |
| 7. The Base Is Gone | media/shorts/rsa_ep07_720p.mp4 | Gallery only. The cards are the evacuation: they followed me, the base, take Marcus north, Kara reached through. That is the harvest finale choice, not the underground chapter and not the ridge two days later. |

Cue windows inside one episode do not overlap. `tools/check-cinematics.mjs` checks the caps.

## Episode One, game shorts, ep1

Level openers do not play `media/shorts/rsa_ep*_720p.mp4`. Those book files stay on the archive row. A level clip points at `media/shorts/game/`. If that mp4 is missing, the clip skips to control (the two origin lines still play on the train open). The door off the train is a timed story choice, not a clip. Cue length matches each level file.

| Clip | When | Cap | File | What the player hits |
|---|---|---|---|---|
| ep1_wake | open | 15s | media/shorts/game/game_ep1_origin_v2.mp4 (cue 0 to 15) | No memory. A twenty foot hunter under a blood sky. He dives into the dead rail car and goes still. Then control, and CHOOSE A WAY OFF THE TRAIN. |
| ep1_street | room 2 | 10s | media/shorts/game/game_ep1_street.mp4 (cue 0 to 10) | CROSS THE RUINED STREET. Drones in the game, not the book Short. |
| ep1_depot | room 5 | 10s | media/shorts/game/game_ep1_depot.mp4 (cue 0 to 10) | PULL THE LEDGER AT THE DEPOT SCREEN. |

Posters, same folder:

- media/shorts/game/game_ep1_origin_v2.mp4 and media/shorts/game/game_ep1_origin_v2.jpg
- media/shorts/game/game_ep1_street.mp4 and media/shorts/game/game_ep1_street.jpg
- media/shorts/game/game_ep1_depot.mp4 and media/shorts/game/game_ep1_depot.jpg

The origin clip is in: `media/shorts/game/game_ep1_origin_v2.mp4`, poster `media/shorts/game/game_ep1_origin_v2.jpg`. The face is the RSA Shorts Marcus (the Ep1 wake, run, and train look). Not a new actor. Not the human avatar built in this game. New Game plays cue 0 to 15. If that file fails to load, the two train intro lines still play and control returns in the car. The archive row is `ready`, so the checker requires the file and PLAY FULL SHORT is on.

`media/shorts/game/game_ep1_origin.mp4` is retired and is not in the repo. It is not the New Game open and not an archive row. That cut deletes the car wall so a hatch can appear. Do not add the file back and do not point ep1_wake at it.

`media/shorts/game/game_ep1_train.mp4` stays on the archive row as a rewatch of the rail car. New Game does not play it.

No game_ep1_door clip. The vestibule and the side hatch are the story choice `Two ways off the train`. The vestibule is the quiet path: no face, a calm line. Kicking the hatch plays one machine face scare (the Shorts hunter: dark plate, red sensor cluster, not a person) for about a second, then the scar line `HATCH OPENED. THEY HEARD YOU.` `hatchScar` still lowers vitals, adds the street crawler, and changes Reyes later in Episode One.

Twenty Feet of Machine stays in the gallery as PLAY FULL SHORT. It is not an Episode One level opener.

## Inside the Hive, ch_taken

The open is a game short. `rsa2` stays on the archive row with no file. Later rooms keep their lines. If the mp4 is missing, the open skips to control.

| Clip | When | Cap | File | What the player hits |
|---|---|---|---|---|
| taken_pod | open | 10s | media/shorts/game/game_ch2_hive_pods.mp4 (cue 0 to 10) | Warm light. Ten thousand people breathing. Then ESCAPE THE POD GALLERY. |
| taken_gallery | room 1 | 10s | lines | CROSS THE POD GALLERY. The pod seal line. |
| taken_nursery | room 3 | 12s | lines | CROSS THE NURSERY. Reyes, far above. |

Poster: media/shorts/game/game_ch2_hive_pods.jpg

## The Listening Dark, ch_ghost

The open is a game short. `rsa3` stays on the archive row with no file. The cable room keeps its lines. If the mp4 is missing, the open skips to control.

| Clip | When | Cap | File | What the player hits |
|---|---|---|---|---|
| ghost_well | open | 10s | media/shorts/game/game_ch2_ghost_trunk.mp4 (cue 0 to 10) | The dark under the depot, and the trunk line. FOLLOW THE TRUNK LINE. |
| ghost_cable | room 3 | 14s | lines | CROSS THE CABLE RUN. The radio says MARCUS. |

Poster: media/shorts/game/game_ch2_ghost_trunk.jpg

## The Convoy, ch_together

The open is a game short. `rsa4` stays on the archive row with no file. The checkpoint and the yard keep their lines. If the mp4 is missing, the open skips to control.

| Clip | When | Cap | File | What the player hits |
|---|---|---|---|---|
| convoy_ridge | open | 10s | media/shorts/game/game_ch2_convoy_ridge.mp4 (cue 0 to 10) | Ridge over the valley road. Pod carriers. REACH THE STAGING YARD. |
| convoy_check | room 2 | 10s | lines | CLEAR THE CHECKPOINT. Reyes hands over the rifle. |
| convoy_yard | room 3 | 12s | lines | CROSS THE STAGING YARD. |

Poster: media/shorts/game/game_ch2_convoy_ridge.jpg

## The Long Road, game shorts, ch_lone

Level clips do not play a book RSA file. `rsa5` stays on the archive row with no level cue. A level clip points at `media/shorts/game/`. If that mp4 is missing, the clip skips to control. Cue length matches each file.

| Clip | When | Cap | File | What the player hits |
|---|---|---|---|---|
| road_open | open | 10s | media/shorts/game/game_ch2_lone_highway.mp4 (cue 0 to 10) | Dead highway, then the human pulse. FOLLOW THE DEAD HIGHWAY. |
| road_toll | room 2 | 10s | media/shorts/game/game_ch2_lone_toll.mp4 (cue 0 to 10) | PASS THE TOLL PLAZA. |
| road_climb | room 3 | 10s | media/shorts/game/game_ch2_lone_beacon.mp4 (cue 0 to 10) | CLIMB THE ACCESS ROAD. The beacon is ahead. |

Posters, same folder:

- media/shorts/game/game_ch2_lone_highway.mp4 and media/shorts/game/game_ch2_lone_highway.jpg
- media/shorts/game/game_ch2_lone_toll.mp4 and media/shorts/game/game_ch2_lone_toll.jpg
- media/shorts/game/game_ch2_lone_beacon.mp4 and media/shorts/game/game_ch2_lone_beacon.jpg

## Counting House, ch_counting

The open is a game short. `rsa6` stays on the archive row with no file. The records hall room keeps its lines. If the mp4 is missing, the open skips to control.

| Clip | When | Cap | File | What the player hits |
|---|---|---|---|---|
| count_entry | open | 10s | media/shorts/game/game_ch3_counting_hall.mp4 (cue 0 to 10) | Every copy of the ledger. SLIP INTO THE RECORDS HALL. |
| count_hall | room 1 | 14s | lines | CROSS THE RECORDS HALL UNSEEN. No rifle. Stay out of the light. |

Poster: media/shorts/game/game_ch3_counting_hall.jpg

## The Conduits, ch_conduits

The open is a game short. Forty-Three Left stays in the gallery and is not a level opener. Later rooms still use Eight Hundred Meters where a card exists. If the mp4 is missing, the open skips to control.

| Clip | When | Cap | File | What the player hits |
|---|---|---|---|---|
| conduits_brief | open | 10s | media/shorts/game/game_ch4_conduits_river.mp4 (cue 0 to 10) | Bunker count over the dry riverbed. Forty-three, the fifty million, Omega-7. FOLLOW THE DRY RIVERBED. The Thomas choice comes after control returns. |
| conduits_sweep | room 1 | 10s | text only | STAY UNDER THE PERIMETER SWEEPS. Existing line: cones, stay behind the slabs. Eight Hundred Meters has no sweep card, so this room does not play that file. |
| conduits_dash | room 2 | 12s | 20 to 32 of Eight Hundred Meters | MAKE THE FORTY SECOND DASH. The card is the dash, open ground, forty seconds. |
| conduits_data | room 3 | 8s | 4 to 12 of Eight Hundred Meters | FOLLOW THE DATA CONDUITS. Existing line: power, data, coolant. |

Poster: media/shorts/game/game_ch4_conduits_river.jpg

They Are Stealing Our Minds is on the archive row and has no level clip. Its cards repeat the briefing that the open lines and the Thomas choice already play. Forty-Three Left stays PLAY FULL SHORT in the gallery.

## The Harvest, ch_harvest

The open is a game short. The tower gallery stays The Afternoons. The depletion floor stays Batch, 8 to 16s. If the mp4 is missing, the open skips to control.

| Clip | When | Cap | File | What the player hits |
|---|---|---|---|---|
| harvest_hatch | open | 10s | media/shorts/game/game_ch5_harvest_core.mp4 (cue 0 to 10) | Cathedral of chrome and pulsing light. ONTO THE CATWALK. Control returns before Angela. |
| harvest_gallery | room 2 | 16s | 16 to 32 of The Afternoons | CROSS THE TOWER GALLERY. Blue to amber. The Angela choice is the door story before this clip. |
| harvest_floor | room 3 | 8s | 8 to 16 of Batch | CROSS THE DEPLETION FLOOR. The card is the depletion count. The hum line stays. |

Poster: media/shorts/game/game_ch5_harvest_core.jpg

The Base Is Gone is on the archive row and has no level clip. Playing it under the depot, or over the ridge opener two days later, would put the evacuation on the wrong beat. The harvest finale choice still tells that scene.

## Fire and Steel, ch_steel

The open is a game short named for the pass. It plays at the chapter start, not on the room 1 beat. `rsa9` stays a hook with no file, so the pass room and the yard stay lines. If the mp4 is missing, the open skips to control.

| Clip | When | Cap | File | What the player hits |
|---|---|---|---|---|
| steel_ridge | open | 10s | media/shorts/game/game_ch6_steel_pass.mp4 (cue 0 to 10) | Ridge before the pass. FOLLOW THOMAS NORTH. Two days north, and what kind of man. The start choice follows after control returns. |
| steel_pass | room 1 | 12s | lines | CROSS THE MOUNTAIN PASS. They were losing. |
| steel_yard | room 4 | 12s | lines | HOLD THE LABORATORY. The yard before the hunter. The Kara offer (core story) runs after this clip, then the fight. |

Poster: media/shorts/game/game_ch6_steel_pass.jpg

## Gallery vs level

- ARCHIVE on the title lists every episode, each beat row, and MONTAGE OF OPENERS.
- Every chapter open is a game short under `media/shorts/game/`.
- PLAY FULL SHORT is on for all seven Book One shorts: Twenty Feet of Machine, Forty-Three Left, They Are Stealing Our Minds, The Afternoons, Eight Hundred Meters, Batch, and The Base Is Gone. Forty-Three Left is gallery only.
- Hive, Listening Dark, Convoy, Long Road, and Counting House book rows still read FULL SHORT NOT LINKED. Fire and Steel stays the hook. Those chapter opens are the game shorts, not those empty rows.
- In a level, `playClip` stops at `max` (never above 20) and, if a file exists, stops at the end of `cue`.
