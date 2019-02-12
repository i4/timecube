<?php
require_once('config.php');

try {
		$pdo = new PDO("pgsql:host=$DBHOST;dbname=$DBNAME;user=$DBUSER;password=$DBPASS");
			$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (\PDOException $e) {
		echo "Message: ". $e->getMessage();
			echo "Code: ".((int)$e->getCode());
}

?>
