<?php
$pdo = new PDO('mysql:host=localhost;dbname=o2angapp_oranges', 'o2angapp_user', 'LwRbn8m@DhKAH@yC');
$rows = $pdo->query("SELECT nutrient_key, recommended_daily_value, unit FROM daily_nutritional_requirements WHERE age=62 AND gender='female' ORDER BY nutrient_key")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo $r['nutrient_key'] . ': ' . $r['recommended_daily_value'] . " '" . $r['unit'] . "'\n";
}
