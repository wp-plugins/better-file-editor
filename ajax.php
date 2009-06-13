<?php
// Include the MySQL connection
include(realpath('../../../wp-config.php'));

$file = trim($_POST['file'], '/');
$code = stripslashes($_POST['code']);
$action = $_POST['action'];
$fullpath = ABSPATH . $file;

if ($_POST['auth'] != md5(AUTH_KEY))
{
    die('Error: Authentication failed');
}

if ('load' == $action)
{
    echo file_get_contents($fullpath);
}

elseif ('save' == $action)
{
    if (!is_writeable($fullpath))
    {
        die("Error: $file is not writeable!");
    }
    $fp = fopen($fullpath, 'w');
    fwrite($fp, $code);
    fclose($fp);
}
