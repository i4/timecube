<?php
require_once('config.php');

function exception_error_handler($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        // This error code is not included in error_reporting
        return;
    }
    throw new ErrorException($message, 0, $severity, $file, $line);
}
set_error_handler("exception_error_handler");

function status($msg, $code = 400, $title = 'Bad Request'){
	header("HTTP/1.0 $code $title");
	die("<h1>$title</h1>".$msg);
}

$pdo = new PDO("pgsql:host=$DBHOST;dbname=$DBNAME;user=$DBUSER;password=$DBPASS");
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$mac = null;
$alias = null;
$email = null;
$name = null;
$note = null;
$site = empty($_REQUEST['site']) ? 'dashboard' : $_REQUEST['site'];

if (!empty($_REQUEST['mac'])){
	$stmt_client = $pdo->prepare('SELECT mac, alias, email, name, note FROM client WHERE mac = ?');
	if ($stmt_client->execute(array($_REQUEST['mac'])) && $row_client = $stmt_client->fetch(PDO::FETCH_ASSOC)){
		$mac = $row_client['mac'];
		$alias = $row_client['alias'];
		$email = $row_client['email'];
		$name = $row_client['name'];
		$note = $row_client['note'];
	} else {
		// Datensatz anlegen
		$pdo->beginTransaction();
		$stmt_client = $pdo->prepare('INSERT INTO client (mac, alias, email, name, note) VALUES (?, ?, NULL, NULL, NULL)');
		$alias = empty($_REQUEST['alias']) ? $_REQUEST['mac'] : $_REQUEST['alias'];
		if ($stmt_client->execute(array($_REQUEST['mac'], $alias ))){
			$mac = $_REQUEST['mac'];
			// Standardbezeichner anlegen
			$stmt_desc = $pdo->prepare('INSERT INTO description (mac, side, hide, name) VALUES (?, ?, ?, ?)');
			foreach($SIDES as $side)
				$stmt_desc->execute(array($mac, $side['id'], $side['hide'] ? 1 : 0, $side['name']));
		}
		$pdo->commit();
	}
} else if (!empty($_REQUEST['alias'])){
	$stmt_client = $pdo->prepare('SELECT mac, alias, email, name, note FROM client WHERE alias = ?');
	if ($stmt_client->execute(array($_REQUEST['alias'])) && $row_client = $stmt_client->fetch(PDO::FETCH_ASSOC)){
		$mac = $row_client['mac'];
		$alias = $row_client['alias'];
		$email = $row_client['email'];
		$name = $row_client['name'];
		$note = $row_client['note'];
	}
} else {
	status('Keine Benutzerkennung');
}

if (empty($mac)){
	status('Keine valide Benutzerkennung');
}



switch ($site){
	case 'data.js':
		// Header
		header('Content-type: text/javascript');
		echo 'var data={"name":"'.$name.'","connection":';
		// Connection data
		$stmt_conn = $pdo->prepare('SELECT connection.side AS sid, description.side AS side, description.name AS task, connection.time AS time, connection.voltage AS voltage FROM connection JOIN description ON (connection.side = description.id) WHERE connection.mac = ? ORDER BY connection.time');
		$stmt_conn->execute(array($mac));
		echo json_encode($stmt_conn->fetchAll(PDO::FETCH_ASSOC));
		echo ',"series":[';
		// Data
		$stmt_desc = $pdo->prepare('SELECT id AS sid, side, hide, name AS task FROM description WHERE mac = ? ORDER BY id');
		$stmt_desc->execute(array($mac));
		$stmt_log = $pdo->prepare('SELECT begin, stop FROM data WHERE side = ? ORDER BY begin');
		$first = true;
		while ($row_desc = $stmt_desc->fetch(PDO::FETCH_ASSOC)){
			if ($first)
				$first = false;
			else
				echo ',';
			$stmt_log->execute(array($row_desc['sid']));
			// Get time log data
			$row_desc['data'] = $stmt_log->fetchAll(PDO::FETCH_NUM);
			echo json_encode($row_desc);
		}
		echo ']};';
		break;

	case 'upload':
		// validate
		if (empty($_REQUEST['v']) || !ctype_xdigit($_REQUEST['v']) || strlen($_REQUEST['v']) != 2 ||
		    empty($_REQUEST['t']) || !ctype_xdigit($_REQUEST['t']) || strlen($_REQUEST['t']) != 8 )
			error('Ungueltige Parameter');
		$time = hexdec($_REQUEST['t']);

		// fetch current sides
		$stmt_desc = $pdo->prepare('SELECT DISTINCT ON (side) id, side FROM description WHERE mac = ? ORDER BY side,id DESC');
		$stmt_desc->execute(array($mac));
		$side_id = array();
		while ($row_desc = $stmt_desc->fetch(PDO::FETCH_ASSOC))
			$side_id[$row_desc['side']] = $row_desc['id'];
		// Use delta time (if necessary)
		$delta = 0;
		if ($time < 1000000000){
			$delta = -$time;
			$time = time();
			$delta += $time;
		}
		// update data
		$pdo->beginTransaction();
		$side = 0;
		if (!empty($_REQUEST['d'])){
			$data = explode(' ', $_REQUEST['d']);
			if (count($data) > 0){
				$stmt_data = $pdo->prepare('INSERT INTO data (side, begin, stop) VALUES (?, ?, ?)');
				for ($i = 0; $i < count($data); $i++){
					$d = hexdec($data[$i]);
					$side = $d & 0x7;
					$begin = $d & ~(0x7);
					if ($i < count($data) - 1 ){
						$stop =  hexdec($data[$i + 1]) & ~(0x7);
						if ($begin < $stop)
							$stmt_data->execute(array($side_id[$side], $begin, $stop));
					}
				}
			}
		}
		// update connection
		$voltage = hexdec($_REQUEST['v']);
		$stmt_conn = $pdo->prepare('INSERT INTO connection (mac, side, time, voltage) VALUES (?, ?, ?, ?)');
		$stmt_conn->execute(array($mac, $side_id[$side], $time, $voltage));
		$pdo->commit();
		status('Eingetragen.', 200, 'OK');
		break;

	case 'dashboard':
	case 'update':
	default:
		include('dashboard.html');
}


?>

