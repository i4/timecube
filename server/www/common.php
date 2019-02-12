<?php
require_once('config.php');

try {
	$pdo = new PDO("pgsql:host=$DBHOST;dbname=$DBNAME;user=$DBUSER;password=$DBPASS");
	$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (\PDOException $e) {
	echo "Message: ". $e->getMessage();
	echo "Code: ".((int)$e->getCode());
}

$mac = null;
$alias = null;
$email = null;
$name = null;
$note = null;

print_r($_REQUEST);
if (!empty($_REQUEST['mac'])){
	$stmt = $pdo->prepare('SELECT mac, alias, email, name, note FROM client WHERE mac = ?');
	if ($stmt->execute(array($_REQUEST['mac'])) && ($stmt = $stmt->fetch(PDO::FETCH_ASSOC))){
		$mac = $result['mac'];
		$alias = $result['alias'];
		$email = $result['email'];
		$name = $result['name'];
		$note = $result['note'];
	} else {
		// Datensatz anlegen
		$stmt = $pdo->prepare('INSERT INTO client (mac, alias, email, name, note) VALUES (?, ?, NULL, NULL, NULL)');
		if ($stmt->execute(array($_REQUEST['mac'], $_REQUEST['mac']))){
			$mac = $_REQUEST['mac'];
			$alias = $_REQUEST['mac'];
			// Standardbezeichner anlegen
			$stmt = $pdo->prepare('INSERT INTO description (mac, side, name) VALUES (?, ?, ?);');
			foreach($SIDES as $side => $name)
				$stmt->execute(array($mac, $side, $name));
		}
	}
} else if (!empty($_REQUEST['alias'])){
	$stmt = $pdo->prepare('SELECT mac, alias, email, name, note FROM client WHERE alias = ?');
	if ($stmt->execute(array($_REQUEST['alias']))){
		if ($result = $stmt->fetch(PDO::FETCH_ASSOC)){
			$mac = $result['mac'];
			$alias = $result['alias'];
			$email = $result['email'];
			$name = $result['name'];
			$note = $result['note'];
		}
	}
} else {
	die('Keine Geraetekennung uebertragen');
}

if (empty($mac)){
	die('Unbekanntes Geraet');
}

?>
