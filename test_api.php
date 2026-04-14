<?php
$ch=curl_init('http://127.0.0.1:8001/ajax.php');
curl_setopt($ch,CURLOPT_RETURNTRANSFER,true);
curl_setopt($ch,CURLOPT_POST,true);
curl_setopt($ch,CURLOPT_POSTFIELDS,'{"action":"summary","fileName":"test.pdf"}');
$res=curl_exec($ch);
echo $res;
