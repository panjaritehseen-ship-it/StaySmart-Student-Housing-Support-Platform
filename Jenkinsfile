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

                    Write-Host "Checking Node.js..."
                    node --version

                    Write-Host "Checking npm..."
                    npm --version

                    Write-Host "Environment check passed."
                '''
            }
        }

        stage('Verify Project Files') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $requiredFiles = @(
                        "index.html",
                        "js/data.js",
                        "js/panel.js",
                        "js/app.js",
                        "js/vendor.js",
                        "js/admin.js",
                        "tests/staysmart.test.js"
                    )

                    foreach ($file in $requiredFiles) {
                        if (-not (Test-Path $file)) {
                            throw "Missing required file: $file"
                        }

                        Write-Host "Found: $file"
                    }

                    Write-Host "Project structure verified."
                '''
            }
        }

        stage('JavaScript Syntax Tests') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $jsFiles = @(
                        "js/data.js",
                        "js/panel.js",
                        "js/app.js",
                        "js/vendor.js",
                        "js/admin.js",
                        "tests/staysmart.test.js"
                    )

                    foreach ($file in $jsFiles) {
                        Write-Host "Checking syntax: $file"

                        node --check $file

                        if ($LASTEXITCODE -ne 0) {
                            throw "Syntax error found in $file"
                        }
                    }

                    Write-Host "All JavaScript syntax checks passed."
                '''
            }
        }

        stage('Application Tests') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    Write-Host "========================================"
                    Write-Host " Running StaySmart Test Suite"
                    Write-Host "========================================"

                    node tests/staysmart.test.js

                    if ($LASTEXITCODE -ne 0) {
                        throw "StaySmart automated tests failed."
                    }

                    Write-Host "All application tests passed."
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

        always {
            echo 'StaySmart CI: Pipeline execution completed.'
        }
    }
}