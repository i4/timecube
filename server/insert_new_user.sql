BEGIN;

WITH data (     name       ,      email         ,      alias     ,      mac           ) AS (
   VALUES (text 'Dein Name', text 'name@mail.de', text 'kurzeURL', text 'F14xxxxxxxxx')
), adduser AS (
	INSERT INTO users (name, alias, email, note)
	SELECT name, alias, email, '' FROM data
	RETURNING uid
), addcube AS (
	INSERT INTO cubes (uid, mac, secret)
	SELECT uid, mac, '' FROM adduser CROSS JOIN data
), addcat0 AS (
	INSERT INTO categories (name, color, icon, hidden, uid) SELECT 'Unbekannt', '546E7A', 'fa-question-circle', true, uid FROM adduser RETURNING id
), addcat1 AS (
	INSERT INTO categories (name, color, icon, hidden, uid) SELECT 'Feierabend', '008FFB', 'fa-bed', true, uid FROM adduser RETURNING id
), addcat2 AS (
	INSERT INTO categories (name, color, icon, hidden, uid) SELECT 'Sonstiges', 'FF4560', 'fa-cog', false, uid FROM adduser RETURNING id
), addcat3 AS (
	INSERT INTO categories (name, color, icon, hidden, uid) SELECT 'Besprechung', '00E396', 'fa-users', false, uid FROM adduser RETURNING id
), addcat4 AS (
	INSERT INTO categories (name, color, icon, hidden, uid) SELECT 'Kaffeepause', '775DD0', 'fa-mug-hot', true, uid FROM adduser RETURNING id
), addcat5 AS (
	INSERT INTO categories (name, color, icon, hidden, uid) SELECT 'Lehre', '00D9E9', 'fa-chalkboard-teacher', false, uid FROM adduser RETURNING id
), addcat6 AS (
	INSERT INTO categories (name, color, icon, hidden, uid) SELECT 'Forschung', 'FEB019', 'fa-flask', false, uid FROM adduser RETURNING id
), addside0 AS (
	INSERT INTO cubesides (mac, side, category) SELECT mac, 0, id FROM addcat0 CROSS JOIN data RETURNING id
), addside1 AS (
	INSERT INTO cubesides (mac, side, category) SELECT mac, 1, id FROM addcat1 CROSS JOIN data
), addside2 AS (
	INSERT INTO cubesides (mac, side, category) SELECT mac, 2, id FROM addcat2 CROSS JOIN data
), addside3 AS (
	INSERT INTO cubesides (mac, side, category) SELECT mac, 3, id FROM addcat3 CROSS JOIN data
), addside4 AS (
	INSERT INTO cubesides (mac, side, category) SELECT mac, 4, id FROM addcat4 CROSS JOIN data
), addside5 AS (
	INSERT INTO cubesides (mac, side, category) SELECT mac, 5, id FROM addcat5 CROSS JOIN data
), addside6 AS (
	INSERT INTO cubesides (mac, side, category) SELECT mac, 6, id FROM addcat6 CROSS JOIN data
)
INSERT INTO connection (mac, side, voltage, time)
SELECT mac, id, 0, extract(epoch from now()) FROM data CROSS JOIN addside0;

COMMIT;
