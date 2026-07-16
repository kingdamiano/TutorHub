<?php

function secondsSinceMidnight(DateTimeInterface $t): int {
    return ((int)$t->format('H') * 3600) + ((int)$t->format('i') * 60) + (int)$t->format('s');
}

function overlaps(string $ns, string $ne, string $es, string $ee): bool {
    $newStart = new DateTime($ns);
    $newEnd = new DateTime($ne);
    $existingStart = new DateTime($es);
    $existingEnd = new DateTime($ee);
    return secondsSinceMidnight($newStart) < secondsSinceMidnight($existingEnd)
        && secondsSinceMidnight($existingStart) < secondsSinceMidnight($newEnd);
}

$cases = [
    ['9:00-9:59', '1970-01-01T09:00:00+00:00', '1970-01-01T09:59:00+00:00'],
    ['9:00-10:00', '1970-01-01T09:00:00+00:00', '1970-01-01T10:00:00+00:00'],
    ['11:00-12:00', '1970-01-01T11:00:00+00:00', '1970-01-01T12:00:00+00:00'],
];
$existingStart = '1970-01-01T10:00:00+00:00';
$existingEnd = '1970-01-01T14:00:00+00:00';
foreach ($cases as [$label, $ns, $ne]) {
    echo "$label vs 10:00-14:00 => ".(overlaps($ns, $ne, $existingStart, $existingEnd) ? 'overlap' : 'ok')."\n";
}
