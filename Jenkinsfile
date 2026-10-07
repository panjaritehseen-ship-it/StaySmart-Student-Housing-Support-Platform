pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment Check') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    Write-Output "Checking Node.js installation..."

                    node --version

                    if ($LASTEXITCODE -ne 0) {
                        throw "Node.js is required for the StaySmart test suite."
                    }

                    Write-Output "Node.js is available."
                '''
            }
        }

        stage('JavaScript Syntax Tests') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $jsFiles = @(
                        'js/data.js',
                        'js/panel.js',
                        'js/app.js',
                        'js/vendor.js',
                        'js/admin.js',
                        'tests/staysmart.test.js'
                    )

                    foreach ($file in $jsFiles) {

                        Write-Output "Testing JavaScript syntax: $file"

                        node --check $file

                        if ($LASTEXITCODE -ne 0) {
                            throw "JavaScript syntax test failed: $file"
                        }
                    }

                    Write-Output "All JavaScript syntax tests passed."
                '''
            }
        }

        stage('Application Tests') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    Write-Output ""
                    Write-Output "========================================"
                    Write-Output " Running StaySmart Test Suite"
                    Write-Output "========================================"
                    Write-Output ""

                    node tests/staysmart.test.js

                    if ($LASTEXITCODE -ne 0) {
                        throw "StaySmart automated tests failed."
                    }
                '''
            }
        }
    }

    post {
        success {
            echo 'StaySmart CI: ALL TESTS PASSED'
        }

        failure {
            echo 'StaySmart CI: TESTS FAILED'
        }
    }
}
