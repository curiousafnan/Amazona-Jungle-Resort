<?php
// Copy this file to config.php (in this same api/ folder) on the server and paste your Zapier hook URL.
// config.php is listed in .gitignore, so the hook URL never ends up in GitHub.
return [
    // Zapier > Create Zap > Trigger "Webhooks by Zapier" > "Catch Hook" > copy the URL here
    'zapier_hook'   => 'https://hooks.zapier.com/hooks/catch/8856609/45u1lcw/',
    // Extra domains allowed to post the form (your own domain is always allowed), e.g. 'www.amazonajungleresort.com'
    'allowed_hosts' => ['www.amazonajungleresort.com'],
    // Most form sends allowed per visitor in 10 minutes
    'rate_limit'    => 6,
];
