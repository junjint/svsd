import type { Activity } from '@/types';

/**
 * Seed activity library for the Draw (docs/SPEC.md §3, §7).
 * placeTags match Place.category or Place.tags; '*' fits any place.
 * Voice: imperative, sentence case, no trailing period, ≤ 60 chars.
 * groupText replaces text when the party is 2+.
 * Rarity mix is roughly 75% common, 20% rare, 5% legendary (checked in __tests__/content.test.ts).
 */
const a = (
  id: string,
  text: string,
  questTypes: Activity['questTypes'],
  placeTags: string[],
  extra: Partial<Activity> = {}
): Activity => ({
  id,
  text,
  questTypes,
  placeTags,
  minParty: 1,
  maxParty: 8,
  rarity: 'common',
  durationMin: 30,
  costTier: 0,
  indoorOutdoor: 'any',
  source: 'seed',
  ...extra,
});

/* Shared tag groups, so related activities stay in sync with place tags */
const EATS = ['local_food', 'restaurant', 'food_hall', 'diner', 'counter'];
const SWEETS = ['bakery', 'cafe', 'coffee', 'dessert', 'ice_cream', 'tea'];
const GREEN = ['nature', 'park', 'garden', 'trees', 'lawn'];
const WATER = ['waterfront', 'river', 'pond'];
const SEATS = ['bench', 'plaza', 'square'];
const QUIET_INDOORS = ['study_spots', 'library', 'cafe', 'coffee', 'tea', 'quiet'];
const BOOKS = ['bookstores', 'bookstore', 'books', 'library'];
const ART = ['museum', 'art', 'gallery', 'cultural'];
const STREETS = ['architecture', 'landmark', 'plaza', 'square', 'campus'];

export const ACTIVITIES: Activity[] = [
  /* ── meal ─────────────────────────────────────────────── */
  a('act_unpronounceable', "Order the dish you can't pronounce", ['meal'], [...EATS], {
    costTier: 2,
    durationMin: 60,
    groupText: "Everyone orders one dish they can't pronounce, then swap",
  }),
  a('act_menu_roulette', 'Close your eyes and point at the menu', ['meal', 'snack'], [...EATS, ...SWEETS, 'cart'], {
    costTier: 1,
    rarity: 'rare',
    groupText: 'Take turns pointing at the menu with your eyes closed',
  }),
  a('act_regulars_order', 'Ask what the regulars always get, then get it', ['meal', 'snack'], [...EATS, ...SWEETS, 'cart'], {
    costTier: 1,
    durationMin: 40,
  }),
  a('act_off_hand', 'Eat the whole meal with your non-dominant hand', ['meal'], [...EATS], {
    costTier: 1,
    durationMin: 45,
    groupText: 'Everyone eats with their non-dominant hand, no cheating',
  }),
  a('act_counter_seat', 'Sit at the counter and watch the kitchen work', ['meal'], ['counter', 'diner', 'restaurant', 'local_food'], {
    costTier: 1,
    durationMin: 45,
    maxParty: 3,
  }),
  a('act_spice_up', 'Go one spice level higher than usual', ['meal'], [...EATS, 'cart'], { costTier: 1, durationMin: 40 }),
  a('act_breakfast_dinner', 'Order breakfast for dinner, unapologetically', ['meal'], ['diner', 'cafe', 'restaurant', 'counter'], {
    costTier: 1,
    durationMin: 45,
  }),
  a('act_critic', 'Write a one-line review like a famous food critic', ['meal', 'snack'], [...EATS, ...SWEETS], {
    costTier: 1,
    groupText: 'Each write a dramatic one-line review and read it aloud',
  }),
  a('act_soup_of_day', 'Order the soup of the day, whatever it is', ['meal'], ['diner', 'restaurant', 'local_food', 'cafe', 'counter'], {
    costTier: 1,
    durationMin: 40,
  }),
  a('act_last_on_menu', 'Order the very last thing on the menu', ['meal', 'snack'], [...EATS, ...SWEETS, 'cart'], { costTier: 1 }),
  a('act_family_style', 'Order family-style and share every plate', ['meal'], [...EATS], {
    costTier: 2,
    durationMin: 75,
    minParty: 2,
  }),
  a('act_counter_choice', 'Let the person taking your order choose for you', ['meal', 'snack'], [...EATS, ...SWEETS, 'cart'], {
    costTier: 1,
    rarity: 'rare',
    groupText: 'Let the person taking your order choose for everyone',
  }),
  a('act_new_cuisine', "Eat a cuisine you've never tried before", ['meal'], [...EATS, 'market'], { costTier: 2, durationMin: 60 }),
  a('act_stall_hop', 'Get one bite from three different stalls', ['meal', 'snack'], ['food_hall', 'market'], {
    costTier: 2,
    durationMin: 60,
    groupText: 'Split up, each grab one bite, then regroup and share',
  }),
  a('act_new_ingredient', "Buy one ingredient you've never cooked with", ['meal'], ['market', 'farmers_market'], {
    costTier: 1,
    durationMin: 30,
  }),
  a('act_vendor_recipe', "Ask a vendor how they'd cook their favorite thing", ['meal'], ['market', 'farmers_market'], { durationMin: 20 }),
  a('act_market_picnic', 'Build a picnic from the market and find some grass', ['meal', 'nature'], ['market', 'farmers_market', ...GREEN], {
    costTier: 1,
    durationMin: 75,
    rarity: 'rare',
    indoorOutdoor: 'outdoor',
    groupText: 'Each grab one picnic item, no planning, then find grass',
  }),
  a('act_cart_lunch', 'Get lunch from a cart and eat it standing up', ['meal', 'snack'], ['cart', 'street_food', ...SEATS], {
    costTier: 1,
    durationMin: 25,
    indoorOutdoor: 'outdoor',
  }),
  a('act_draw_plate', 'Draw your plate before the first bite', ['meal', 'focus'], [...EATS, 'bakery', 'cafe'], {
    costTier: 1,
    durationMin: 40,
    indoorOutdoor: 'indoor',
    groupText: 'Everyone draws their plate before the first bite',
  }),
  a('act_thank_kitchen', 'Tell the kitchen it was good, and mean it', ['meal'], [...EATS, 'cart'], { costTier: 1, durationMin: 45 }),
  a('act_hour_meal', 'Make one meal last a whole hour', ['meal'], ['restaurant', 'diner', 'local_food', 'cafe'], {
    costTier: 2,
    durationMin: 60,
    groupText: 'Make one meal last an hour, no phones on the table',
  }),
  a('act_noodle_slurp', 'Order the noodles and slurp like you mean it', ['meal'], ['noodles', 'restaurant', 'food_hall'], {
    costTier: 1,
    durationMin: 40,
  }),
  a('act_order_in_language', "Learn to order in the menu's language, then do it", ['meal'], [...EATS, 'cart'], {
    costTier: 2,
    durationMin: 60,
    rarity: 'legendary',
  }),
  // meal wildcards: any place can send you to eat nearby
  a('act_five_min_lunch', 'Eat lunch within a five-minute walk of here', ['meal'], ['*'], { costTier: 1, durationMin: 45 }),
  a('act_takeout_bench', 'Grab takeout and eat it on the nearest bench', ['meal'], ['*'], {
    costTier: 1,
    durationMin: 40,
    indoorOutdoor: 'outdoor',
  }),
  a('act_phone_in_bag', 'Eat a whole meal with your phone in your bag', ['meal'], ['*'], {
    costTier: 1,
    durationMin: 45,
    groupText: "Phones in a pile until everyone's done eating",
  }),
  a('act_red_sign', 'Let the first red sign you see pick lunch', ['meal'], ['*'], { costTier: 1, durationMin: 60, rarity: 'rare' }),
  a('act_retry_food', "Give a food you've written off a second chance", ['meal', 'snack'], ['*'], { costTier: 1, durationMin: 30 }),
  a('act_dessert_first', 'Order dessert first and stand by it', ['meal', 'snack'], ['*'], { costTier: 1, durationMin: 45, rarity: 'rare' }),
  a('act_progressive_dinner', 'Walk a three-stop dinner: starter, main, dessert', ['meal'], ['*'], {
    costTier: 2,
    durationMin: 150,
    rarity: 'legendary',
    groupText: 'Progressive dinner: each person picks one of three stops',
  }),

  /* ── snack ────────────────────────────────────────────── */
  a('act_pastry_rating', 'Rate three pastries out of 10', ['snack'], ['bakery', 'cafe', 'coffee', 'dessert', 'local_food'], {
    costTier: 1,
    groupText: 'Split three pastries and argue about the scores',
  }),
  a('act_croissant_duel', 'Hold a croissant taste test between two bakeries', ['snack'], ['bakery', 'cafe'], {
    costTier: 1,
    durationMin: 50,
    groupText: 'Croissant face-off: two bakeries, blind taste, one winner',
  }),
  a('act_mystery_drink', "Order the drink on the menu you've never heard of", ['snack'], ['cafe', 'coffee', 'tea'], { costTier: 1, durationMin: 20 }),
  a('act_opposite_drink', 'Order the opposite of your usual drink', ['snack'], ['cafe', 'coffee', 'tea'], { costTier: 1, durationMin: 15 }),
  a('act_barista_day_off', 'Ask the barista what they drink on their day off', ['snack'], ['cafe', 'coffee'], { costTier: 1, durationMin: 15 }),
  a('act_fresh_out', 'Ask what came out of the oven most recently', ['snack'], ['bakery'], { costTier: 1, durationMin: 15 }),
  a('act_window_drink', 'Take the window seat and finish one drink slowly', ['snack', 'focus'], ['cafe', 'coffee', 'tea', 'bakery'], {
    costTier: 1,
    durationMin: 30,
    indoorOutdoor: 'indoor',
  }),
  a('act_walking_snack', 'Buy something from a cart and eat it on a walk', ['snack'], ['cart', 'street_food', ...SEATS, 'park'], {
    costTier: 1,
    durationMin: 20,
    indoorOutdoor: 'outdoor',
  }),
  a('act_tiniest_item', 'Buy the smallest thing on the menu', ['snack'], [...SWEETS, 'cart', 'market', 'food_hall', 'local_food'], {
    costTier: 1,
    durationMin: 15,
  }),
  a('act_weird_scoop', 'Order the weirdest flavor they have', ['snack'], ['ice_cream', 'dessert'], {
    costTier: 1,
    durationMin: 20,
    groupText: 'Everyone orders a weird flavor and trades a spoonful',
  }),
  a('act_tea_ritual', 'Order a pot of tea and let it steep all the way', ['snack', 'focus'], ['tea', 'cafe'], {
    costTier: 1,
    durationMin: 30,
    indoorOutdoor: 'indoor',
  }),
  a('act_guess_orders', 'Guess what the next three customers will order', ['snack'], ['cafe', 'coffee', 'bakery', 'ice_cream'], {
    durationMin: 20,
    groupText: "Guess the next customer's order, closest guess wins",
  }),
  a('act_two_spot_compare', 'Get the same snack from two spots and compare', ['snack'], ['bakery', 'cafe', 'coffee', 'cart', 'dessert', 'ice_cream'], {
    costTier: 1,
    durationMin: 45,
  }),
  a('act_mystery_fruit', "Buy one fruit you can't name and try it", ['snack'], ['market', 'farmers_market'], {
    costTier: 1,
    durationMin: 20,
    rarity: 'rare',
  }),
  a('act_treat_home', 'Buy a treat to bring home to someone', ['snack'], ['bakery', 'dessert', 'cafe', 'market'], { costTier: 1, durationMin: 15 }),
  a('act_dessert_crawl', 'Do a three-stop dessert crawl, one bite each', ['snack'], ['dessert', 'bakery', 'ice_cream', 'food_hall'], {
    costTier: 2,
    durationMin: 90,
    rarity: 'rare',
    groupText: 'Dessert crawl: each person picks one of the three stops',
  }),
  a('act_pastry_sketch', 'Sketch your pastry like a museum piece', ['snack', 'focus'], ['bakery', 'cafe', 'dessert'], {
    costTier: 1,
    durationMin: 20,
    indoorOutdoor: 'indoor',
  }),
  a('act_pay_forward', "Pay for the next person's coffee and slip away", ['snack'], ['cafe', 'coffee', 'bakery'], {
    costTier: 2,
    durationMin: 15,
    rarity: 'legendary',
  }),
  a('act_cart_signature', 'Get the snack the cart is known for', ['snack'], ['cart', 'street_food'], { costTier: 1, durationMin: 15 }),
  // snack wildcards
  a('act_nearest_new_snack', "Find the nearest snack you've never tried", ['snack'], ['*'], { costTier: 1, durationMin: 20 }),
  a('act_snack_delivery', 'Buy a snack for a friend and hand-deliver it', ['snack'], ['*'], {
    costTier: 1,
    durationMin: 45,
    rarity: 'rare',
    groupText: 'Secretly pick a snack for each other, then swap',
  }),
  a('act_rate_everything', 'Rate every snack you eat today out of 10', ['snack'], ['*'], {
    costTier: 1,
    durationMin: 60,
    groupText: 'Rate the same snack, then defend your score',
  }),
  a('act_bench_sweet', 'Eat something sweet on the nearest bench', ['snack'], ['*'], {
    costTier: 1,
    durationMin: 15,
    indoorOutdoor: 'outdoor',
  }),
  a('act_packaging_pick', 'Pick a snack by its packaging alone', ['snack'], ['*'], { costTier: 1, durationMin: 15 }),
  a('act_tiny_picnic', 'Have a three-snack picnic for under $10', ['snack', 'nature'], ['*'], {
    costTier: 1,
    durationMin: 45,
    indoorOutdoor: 'outdoor',
    groupText: 'Each buy one snack under $5 and have a tiny picnic',
  }),
  a('act_snack_view', 'Carry a snack to the best view nearby', ['snack', 'nature'], ['*'], {
    costTier: 1,
    durationMin: 30,
    indoorOutdoor: 'outdoor',
  }),

  /* ── nature ───────────────────────────────────────────── */
  a('act_pigeons', 'Feed the pigeons', ['nature'], ['pigeons', 'plaza', 'square', 'park'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
    groupText: 'Each pick a pigeon and give it a name',
  }),
  a('act_leaf_bookmarks', 'Collect pretty leaves to make bookmarks', ['nature'], [...GREEN], { indoorOutdoor: 'outdoor', durationMin: 40 }),
  a('act_cloud_names', 'Lie down and name five clouds', ['nature'], ['park', 'lawn', 'nature'], {
    indoorOutdoor: 'outdoor',
    durationMin: 15,
  }),
  a('act_bird_count', 'Count every bird you see in 15 minutes', ['nature'], [...GREEN, ...WATER], {
    indoorOutdoor: 'outdoor',
    durationMin: 15,
    groupText: 'Bird race: whoever spots the most kinds wins',
  }),
  a('act_oldest_tree', 'Find the biggest tree and guess its age', ['nature'], [...GREEN, 'campus'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
  }),
  a('act_barefoot', 'Take your shoes off and stand in the grass', ['nature'], ['lawn', 'park'], { indoorOutdoor: 'outdoor', durationMin: 10 }),
  a('act_skip_stones', 'Skip a stone and count the bounces', ['nature'], ['river', 'pond'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
    groupText: 'Stone-skipping tournament, best of five',
  }),
  a('act_water_sit', 'Sit by the water for 20 minutes, no headphones', ['nature', 'focus'], [...WATER, 'pier', 'waterfall'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
  }),
  a('act_flower_names', 'Find five flowers and learn their names', ['nature'], ['garden', 'flowers', 'park', 'conservatory'], {
    durationMin: 30,
  }),
  a('act_bark_rubbing', 'Make a crayon rubbing of bark or a leaf', ['nature'], [...GREEN], {
    indoorOutdoor: 'outdoor',
    costTier: 1,
    durationMin: 20,
  }),
  a('act_dog_vibes', 'Rate every dog you see on vibes alone', ['nature'], ['park', 'plaza', 'square', 'waterfront', 'lawn'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
    groupText: 'Each crown a dog of the day, no petting without asking',
  }),
  a('act_new_path', "Take the path you've never taken", ['nature'], ['park', 'trail', 'garden', 'nature', 'waterfront'], {
    indoorOutdoor: 'outdoor',
    durationMin: 40,
  }),
  a('act_squirrel_watch', 'Watch one squirrel for five minutes and name it', ['nature'], [...GREEN, 'campus', 'squirrels'], {
    indoorOutdoor: 'outdoor',
    durationMin: 10,
    groupText: "Each adopt a squirrel and narrate its day",
  }),
  a('act_moss_pet', 'Find the softest moss and give it one gentle pet', ['nature'], ['trees', 'trail', 'garden', 'nature'], {
    indoorOutdoor: 'outdoor',
    durationMin: 15,
    rarity: 'rare',
  }),
  a('act_long_loop', 'Walk the longest loop here without checking a map', ['nature'], ['park', 'trail', 'nature'], {
    indoorOutdoor: 'outdoor',
    durationMin: 90,
    rarity: 'rare',
  }),
  a('act_cartwheel', 'Try a cartwheel on soft grass, no judgment', ['nature'], ['lawn'], {
    indoorOutdoor: 'outdoor',
    durationMin: 10,
    rarity: 'rare',
    groupText: 'Everyone tries a cartwheel on soft grass, no judgment',
  }),
  a('act_sit_spot', 'Pick a sit spot and notice ten things that move', ['nature', 'focus'], [...GREEN, ...WATER, 'bench'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
  }),
  a('act_play_catch', 'Play catch with whatever you have for 20 minutes', ['nature'], ['park', 'lawn'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
    minParty: 2,
  }),
  a('act_leaf_rainbow', 'Find leaves in five different colors', ['nature'], [...GREEN], { indoorOutdoor: 'outdoor', durationMin: 20 }),
  a('act_favorite_plant', 'Pick a favorite plant and visit it again next week', ['nature'], ['garden', 'flowers', 'conservatory'], {
    durationMin: 20,
    rarity: 'rare',
  }),
  a('act_brightest_star', 'Find the brightest star and look up its name', ['nature'], ['park', 'lawn', 'waterfront', 'pier'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
    rarity: 'rare',
  }),
  a('act_read_under_tree', 'Read under a tree until your leg falls asleep', ['nature', 'focus'], ['trees', 'park', 'lawn', 'garden', 'campus'], {
    indoorOutdoor: 'outdoor',
    durationMin: 60,
  }),
  a('act_watch_light_change', 'Stay by the water until the light changes', ['nature'], [...WATER, 'pier'], {
    indoorOutdoor: 'outdoor',
    durationMin: 90,
    rarity: 'legendary',
  }),
  a('act_sunrise', 'Watch the sunrise from the best spot nearby', ['nature'], ['park', 'waterfront', 'pier', 'lawn', 'nature'], {
    indoorOutdoor: 'outdoor',
    durationMin: 60,
    rarity: 'legendary',
  }),
  a('act_sunset_picnic', 'Pack a three-item picnic and watch the sun go down', ['meal', 'nature'], [...GREEN, ...WATER], {
    costTier: 1,
    rarity: 'legendary',
    durationMin: 90,
    indoorOutdoor: 'outdoor',
  }),
  // nature wildcards: something outside is always reachable
  a('act_photo_walk', 'Take 12 photos of the color yellow', ['nature', 'focus'], ['*'], { indoorOutdoor: 'outdoor' }),
  a('act_listening_post', 'Close your eyes and count the sounds for five minutes', ['focus', 'nature'], ['*'], { durationMin: 10 }),
  a('act_group_relay', 'Take turns choosing which way to walk next', ['nature'], ['*'], {
    minParty: 2,
    durationMin: 45,
    indoorOutdoor: 'outdoor',
  }),
  a('act_find_green', 'Walk until you find something green, then stay', ['nature'], ['*'], {
    indoorOutdoor: 'outdoor',
    durationMin: 25,
  }),
  a('act_look_up_trees', 'Walk one block looking only at the treetops', ['nature'], ['*'], { indoorOutdoor: 'outdoor', durationMin: 15 }),
  a('act_tiny_treasures', 'Find a leaf, a pebble and something round', ['nature'], ['*'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
    groupText: 'Scavenger race: a leaf, a pebble and something round',
  }),
  a('act_sketch_tree', 'Sketch the nearest tree in under 10 minutes', ['nature', 'focus'], ['*'], {
    indoorOutdoor: 'outdoor',
    durationMin: 15,
  }),
  a('act_quietest_sound', 'Record one minute of the quietest sound you can find', ['nature', 'focus'], ['*'], { durationMin: 15 }),
  a('act_cloud_sketch', 'Draw one cloud before it changes shape', ['nature', 'focus'], ['*'], {
    indoorOutdoor: 'outdoor',
    durationMin: 10,
  }),
  a('act_sky_check', 'Find the widest patch of sky and watch it for 10 minutes', ['nature'], ['*'], {
    indoorOutdoor: 'outdoor',
    durationMin: 10,
  }),

  /* ── focus: indoor ────────────────────────────────────── */
  a('act_phone_down_sketch', 'Sketch the room for 45 minutes, phone face-down', ['focus'], [...QUIET_INDOORS, 'museum'], {
    indoorOutdoor: 'indoor',
    durationMin: 45,
  }),
  a('act_first_line', 'Read only the first line of 10 books', ['focus'], [...BOOKS], { indoorOutdoor: 'indoor', durationMin: 20 }),
  a('act_last_line', 'Read the last line of five novels and guess the plot', ['focus'], [...BOOKS], {
    indoorOutdoor: 'indoor',
    durationMin: 20,
    groupText: 'Read last lines aloud and make everyone guess the plot',
  }),
  a('act_blind_book', "Buy a book for its cover and don't read the back", ['focus'], ['bookstores', 'bookstore', 'books'], {
    costTier: 2,
    rarity: 'rare',
    indoorOutdoor: 'indoor',
  }),
  a('act_fire_book', "Ask the bookseller which book they'd save in a fire", ['focus'], ['bookstores', 'bookstore'], {
    indoorOutdoor: 'indoor',
    durationMin: 15,
    rarity: 'rare',
  }),
  a('act_third_shelf', 'Read a chapter of whatever is on the third shelf', ['focus'], ['library'], { indoorOutdoor: 'indoor', durationMin: 45 }),
  a('act_call_number', 'Pick a random call number and go find that book', ['focus'], ['library'], {
    indoorOutdoor: 'indoor',
    durationMin: 30,
    rarity: 'rare',
  }),
  a('act_copy_poem', 'Copy one poem out by hand, slowly', ['focus'], [...BOOKS, 'reading_room'], { indoorOutdoor: 'indoor', durationMin: 20 }),
  a('act_magic_trick', 'Learn one magic trick from a library book', ['focus'], ['library'], {
    indoorOutdoor: 'indoor',
    durationMin: 45,
    rarity: 'rare',
    groupText: 'Each learn a different trick, then perform for the group',
  }),
  a('act_tiny_museum', 'Find the smallest thing on display and draw it', ['focus'], [...ART], { indoorOutdoor: 'indoor' }),
  a('act_one_artwork', 'Spend 20 minutes with just one artwork', ['focus'], ['museum', 'art', 'gallery'], {
    indoorOutdoor: 'indoor',
    durationMin: 20,
  }),
  a('act_retitle_art', 'Give five artworks better titles', ['focus'], ['museum', 'art', 'gallery'], {
    indoorOutdoor: 'indoor',
    durationMin: 30,
    groupText: 'Each retitle the same five artworks, then vote',
  }),
  a('act_oldest_object', 'Find the oldest object in the room and read about it', ['focus'], ['museum', 'cultural'], {
    indoorOutdoor: 'indoor',
    durationMin: 25,
  }),
  a('act_fake_tour', 'Whisper a made-up tour of one gallery to your friends', ['focus'], ['museum', 'gallery', 'art'], {
    indoorOutdoor: 'indoor',
    minParty: 2,
    rarity: 'rare',
  }),
  a('act_staff_fave', 'Ask someone who works here for their favorite piece', ['focus'], ['museum', 'gallery', 'art'], {
    indoorOutdoor: 'indoor',
    durationMin: 15,
  }),
  a('act_avoided_task', "Finish one small task you've been avoiding", ['focus'], [...QUIET_INDOORS, 'reading_room'], {
    indoorOutdoor: 'indoor',
    durationMin: 45,
    groupText: "Everyone names one avoided task, no talking till it's done",
  }),
  a('act_two_sprints', 'Do two 25-minute sprints with a lap in between', ['focus'], [...QUIET_INDOORS, 'reading_room'], {
    indoorOutdoor: 'indoor',
    durationMin: 60,
  }),
  a('act_ten_words', "Learn ten words in a language you don't speak", ['focus'], [...QUIET_INDOORS], {
    indoorOutdoor: 'indoor',
    durationMin: 30,
  }),
  a('act_crossword', 'Finish a crossword without looking anything up', ['focus'], ['cafe', 'coffee', 'diner', 'library', 'tea', 'study_spots'], {
    indoorOutdoor: 'indoor',
    durationMin: 30,
    groupText: 'Solve one crossword together, phones in a pile',
  }),
  a('act_window_100', 'Write 100 words about the view from the window', ['focus'], [...QUIET_INDOORS, 'reading_room'], {
    indoorOutdoor: 'indoor',
    durationMin: 20,
  }),
  a('act_tiny_zine', 'Make a tiny zine from one sheet of paper', ['focus'], [...QUIET_INDOORS, 'bookstores', 'bookstore'], {
    indoorOutdoor: 'indoor',
    durationMin: 60,
    rarity: 'rare',
    groupText: 'Each make one zine page, then fold them into one',
  }),
  a('act_room_map', 'Draw a map of the room from memory, then check', ['focus'], [...QUIET_INDOORS, 'museum', 'station', 'food_hall'], {
    indoorOutdoor: 'indoor',
    durationMin: 20,
  }),
  a('act_whole_book', 'Read a whole short book in one sitting', ['focus'], ['library', 'bookstores', 'cafe', 'reading_room', 'quiet'], {
    indoorOutdoor: 'indoor',
    durationMin: 180,
    rarity: 'legendary',
  }),

  /* ── focus: outdoor ───────────────────────────────────── */
  a('act_bench_journal', 'Write one page about the people walking by', ['focus'], [...SEATS, 'park', 'campus'], {
    indoorOutdoor: 'outdoor',
    durationMin: 30,
  }),
  a('act_architecture_spot', 'Find the oldest door on the block', ['focus', 'nature'], [...STREETS, 'unexpected', 'courtyard'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
  }),
  a('act_sketch_corner', 'Sketch the busiest corner of the square', ['focus'], ['plaza', 'square', 'landmark'], {
    indoorOutdoor: 'outdoor',
    durationMin: 30,
  }),
  a('act_hat_count', 'Count every hat that walks by in 15 minutes', ['focus'], [...SEATS, 'station'], {
    indoorOutdoor: 'outdoor',
    durationMin: 15,
    groupText: 'Each pick a hat style and count it, highest tally wins',
  }),
  a('act_bench_pages', 'Read 30 pages on a bench in the sun', ['focus'], [...SEATS, 'park', 'garden', 'campus', 'courtyard'], {
    indoorOutdoor: 'outdoor',
    durationMin: 45,
  }),
  a('act_sound_map', 'Draw a map of every sound you hear', ['focus', 'nature'], [...SEATS, ...GREEN, ...WATER], {
    indoorOutdoor: 'outdoor',
    durationMin: 15,
  }),
  a('act_ghost_sign', 'Find a faded old sign painted on a building', ['focus'], [...STREETS, 'unexpected', 'alley'], {
    indoorOutdoor: 'outdoor',
    durationMin: 30,
    rarity: 'rare',
  }),
  a('act_stone_faces', 'Spot five faces carved into buildings', ['focus'], ['architecture', 'landmark', 'campus', 'courtyard'], {
    indoorOutdoor: 'outdoor',
    durationMin: 30,
    rarity: 'rare',
  }),
  a('act_top_floors', 'Photograph the top floor of five buildings', ['focus'], [...STREETS, 'station'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
  }),
  a('act_do_nothing', 'Sit on a bench for 10 minutes and do nothing at all', ['focus', 'nature'], [...SEATS, 'park', 'garden', 'waterfront', 'campus'], {
    indoorOutdoor: 'outdoor',
    durationMin: 10,
  }),
  a('act_watercolor', 'Paint the view with a cheap watercolor set', ['focus', 'nature'], [...GREEN, ...WATER, 'plaza', 'square', 'courtyard'], {
    indoorOutdoor: 'outdoor',
    costTier: 1,
    durationMin: 60,
    rarity: 'rare',
  }),
  a('act_mural_title', 'Find a mural and give it a title', ['focus'], ['mural', 'art', 'alley', 'unexpected'], {
    indoorOutdoor: 'outdoor',
    durationMin: 15,
  }),
  a('act_odd_detail', "Find the oddest detail here and invent why it's there", ['focus', 'nature'], ['unexpected', 'hidden', 'courtyard', 'alley', ...STREETS], {
    durationMin: 15,
    groupText: "Everyone finds one odd detail and invents why it's there",
  }),
  a('act_letters_name', 'Find every letter of your name on signs nearby', ['focus'], ['*'], {
    indoorOutdoor: 'outdoor',
    durationMin: 20,
    groupText: 'Race to spell your names from signs, letter by letter',
  }),
  a('act_new_stop', 'Ride three stops somewhere new and walk one block', ['focus', 'nature'], ['station', 'transit'], {
    indoorOutdoor: 'outdoor',
    costTier: 1,
    durationMin: 90,
    rarity: 'rare',
  }),

  /* ── focus: anywhere ──────────────────────────────────── */
  a('act_postcard', 'Write a postcard to yourself and mail it', ['focus'], ['*'], { costTier: 1, rarity: 'rare' }),
  a('act_handwritten_letter', 'Handwrite a letter to someone you miss', ['focus'], ['*'], { durationMin: 40 }),
  a('act_twenty_things', 'List 20 things you want to do this year', ['focus'], ['*'], {
    durationMin: 30,
    groupText: 'Each list 20 things for this year, then share your top 3',
  }),
  a('act_draw_hand', 'Draw your own hand three times, no erasing', ['focus'], ['*'], { durationMin: 20 }),
  a('act_proud_list', "Write down three things you're proud of this month", ['focus'], ['*'], { durationMin: 15 }),
  a('act_last_sitter', 'Write a 50-word story about who sat here last', ['focus'], ['*'], { durationMin: 20 }),
  a('act_haiku_spot', 'Write a haiku about this exact spot', ['focus'], ['*'], {
    durationMin: 10,
    groupText: 'Each write a haiku about this spot, then read them out',
  }),
  a('act_moment_playlist', 'Make a five-song playlist for this exact moment', ['focus'], ['*'], { durationMin: 15 }),
  a('act_text_old_friend', "Text someone you haven't talked to in a year", ['focus'], ['*'], { durationMin: 10, rarity: 'rare' }),
  a('act_portraits', 'Draw each other in five minutes flat', ['focus'], ['*'], { durationMin: 15, minParty: 2 }),
  a('act_fake_history', 'Invent a fake history for this place together', ['focus', 'nature'], ['*'], {
    durationMin: 20,
    minParty: 2,
    rarity: 'rare',
  }),
  a('act_handshake', 'Make up a secret handshake right here', ['focus'], ['*'], { durationMin: 10, minParty: 2 }),
  a('act_i_spy', 'Play I spy until someone gives up', ['focus', 'nature'], ['*'], { durationMin: 15, minParty: 2 }),
  a('act_split_treasure', 'Split up for 20 minutes and each bring back a treasure', ['focus', 'nature'], ['*'], {
    durationMin: 30,
    minParty: 2,
    rarity: 'rare',
  }),
  a('act_recreate_photo', "Take a photo here you'll recreate in a year", ['focus', 'nature'], ['*'], {
    durationMin: 10,
    rarity: 'rare',
    groupText: "Take a group photo here you'll recreate next year",
  }),
  a('act_strangers_recs', 'Ask three people to recommend you a song', ['focus'], ['*'], { rarity: 'legendary', durationMin: 45 }),
  a('act_ask_local', 'Ask someone for their favorite thing nearby, then go', ['meal', 'snack', 'nature', 'focus'], ['*'], {
    rarity: 'rare',
    durationMin: 60,
  }),
  a('act_kind_word', 'Give someone working here a genuine compliment', ['meal', 'snack', 'focus'], ['*'], { durationMin: 10 }),

  /* ── around town: thrift, art, music, landmarks ───────── */
  a('act_thrift_fit', 'Build a full outfit for under $20', ['focus'], ['thrifting', 'vintage', 'thrift'], {
    costTier: 2,
    indoorOutdoor: 'indoor',
    groupText: 'Pick each other an outfit for under $20',
  }),
  a('act_thrift_story', 'Find the strangest object here and invent its past', ['focus'], ['thrifting', 'vintage', 'thrift', 'records'], {
    indoorOutdoor: 'indoor',
    durationMin: 20,
    groupText: 'Find each other the strangest object and explain its past',
  }),
  a('act_five_dollar_gift', "Buy a $5 gift for someone you'll see this week", ['focus', 'snack'], ['thrifting', 'vintage', 'market', 'popup'], {
    costTier: 1,
    durationMin: 30,
    rarity: 'rare',
  }),
  a('act_cover_record', 'Pick a record by its cover and play one side', ['focus'], ['records', 'vintage'], {
    indoorOutdoor: 'indoor',
    costTier: 1,
    durationMin: 30,
    rarity: 'rare',
  }),
  a('act_unknown_artist', "Stay for one song by an artist you don't know", ['focus'], ['live_music', 'music', 'live'], {
    costTier: 1,
    durationMin: 30,
  }),
  a('act_open_mic', 'Read something you wrote out loud at an open mic', ['focus'], ['live_music', 'music', 'open_mic'], {
    costTier: 1,
    durationMin: 90,
    rarity: 'legendary',
    groupText: 'Sign up for an open mic as a group and cheer loudest',
  }),
  a('act_maker_chat', "Ask a maker how they made the thing you like best", ['focus'], ['community_events', 'popup', 'market', 'event'], {
    durationMin: 20,
  }),
  a('act_maker_buy', 'Buy one tiny thing from a local maker', ['focus', 'snack'], ['community_events', 'popup', 'event'], {
    costTier: 1,
    durationMin: 20,
  }),
  a('act_plaque_reader', 'Read three plaques and remember one fact', ['focus'], ['cultural', 'landmark', 'campus', 'plaque'], {
    durationMin: 20,
  }),
  a('act_station_people', 'Find the best seat in the station and people-watch', ['focus'], ['station', 'transit'], {
    durationMin: 20,
    indoorOutdoor: 'indoor',
  }),
  a('act_echo_spot', 'Find the spot where your voice sounds best, softly', ['focus'], ['architecture', 'station', 'courtyard', 'landmark'], {
    durationMin: 15,
    rarity: 'rare',
  }),
];
