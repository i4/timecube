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

$user = array();
$site = empty($_REQUEST['site']) ? 'dashboard' : $_REQUEST['site'];

if (!empty($_REQUEST['mac'])){
	$stmt_client = $pdo->prepare('SELECT cubes.uid AS uid, cubes.mac AS mac, users.alias AS alias, users.email AS email, users.name AS name, users.note AS note, users.password AS password FROM cubes JOIN users ON (cubes.uid = users.uid) WHERE cubes.mac = ?');
	if ($stmt_client->execute(array($_REQUEST['mac'])) && $row_client = $stmt_client->fetch(PDO::FETCH_ASSOC)){
		$user = new ArrayObject($row_client);
	}
} else if (!empty($_REQUEST['alias'])){
	$stmt_user = $pdo->prepare('SELECT uid, alias, email, name, note, password FROM users WHERE alias = ?');
	if ($stmt_user->execute(array($_REQUEST['alias'])) && $row_user = $stmt_user->fetch(PDO::FETCH_ASSOC)){
		$user = new ArrayObject($row_user);
	}
} else {
	status('Keine Benutzerkennung');
}

if (empty($user['uid'])){
	status('Keine valide Benutzerkennung');
}



switch ($site){
	case 'data.js':
		// Header
		header('Content-type: text/javascript');
		echo 'var data={"name":"'.$user['name'].'","cube":[';
		$stmt_cube = $pdo->prepare('SELECT mac, name FROM cubes WHERE uid = ? ORDER BY mac');
		$stmt_cube->execute(array($user['uid']));
		while ($row_cube = $stmt_cube->fetch(PDO::FETCH_ASSOC)){
			// Connection data
			$stmt_conn = $pdo->prepare('SELECT voltage, time FROM connection WHERE mac = ? ORDER BY time');
			$stmt_conn->execute(array($row_cube['mac']));
			echo '{"id":"'.$row_cube['name'].'","connection":'.json_encode($stmt_conn->fetchAll(PDO::FETCH_ASSOC)).'},';
		}
		echo '],"series":[';
		// Data
		$stmt_desc = $pdo->prepare("SELECT id AS sid, name AS task, concat('#', color) AS color, icon, hidden AS hide FROM categories WHERE uid = ? ORDER BY id");
		$stmt_desc->execute(array($user['uid']));
		$stmt_log = $pdo->prepare('SELECT begin, stop FROM data WHERE category = ? ORDER BY begin');
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
		$stmt_desc = $pdo->prepare('SELECT DISTINCT ON (side) category, side FROM cubesides WHERE mac = ? ORDER BY side,id DESC');
		$stmt_desc->execute(array($_REQUEST['mac']));
		$category = array();
		while ($row_desc = $stmt_desc->fetch(PDO::FETCH_ASSOC))
			$category[$row_desc['side']] = $row_desc['category'];
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
		$items = 0;
		if (!empty($_REQUEST['d'])){
			$data = explode(' ', $_REQUEST['d']);
			if (count($data) > 0){
				$stmt_data = $pdo->prepare('INSERT INTO data (category, begin, stop, mac) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING');
				for ($i = 0; $i < count($data); $i++){
					$d = hexdec($data[$i]);
					$side = $d & 0x7;
					$begin = $d & ~(0x7);
					if ($i < count($data) - 1 ){
						$stop =  hexdec($data[$i + 1]) & ~(0x7);
						if ($begin < $stop) {
							$items++;
							$stmt_data->execute(array($category[$side], $begin, $stop, $_REQUEST['mac']));
						}
					}
				}
			}
		}
		// update connection
		$voltage = hexdec($_REQUEST['v']);
		$stmt_conn = $pdo->prepare('INSERT INTO connection (mac, items, time, voltage) VALUES (?, ?, ?, ?)');
		$stmt_conn->execute(array($_REQUEST['mac'], $items, $time, $voltage));
		$pdo->commit();
		status('Eingetragen.', 200, 'OK');
		break;

	case 'dashboard':
	case 'update':
	default:
		include('dashboard.html');
}
?>
