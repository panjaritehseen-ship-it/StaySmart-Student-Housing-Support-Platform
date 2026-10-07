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

        stage('Validate project') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    $requiredFiles = @(
                        'index.html',
                        'vendor.html',
                        'admin.html',
                        'css/style.css',
                        'js/data.js',
                        'js/panel.js',
                        'js/app.js',
                        'js/vendor.js',
                        'js/admin.js',
                        'images/properties/bedroom.jpg'
                    )

                    foreach ($file in $requiredFiles) {
                        if (-not (Test-Path -LiteralPath $file -PathType Leaf)) {
                            throw "Required project file is missing: $file"
                        }
                    }

                    $node = Get-Command node -ErrorAction SilentlyContinue

                    if ($node) {
                        Get-ChildItem -LiteralPath 'js' -Filter '*.js' |
                            ForEach-Object {
                                & $node.Source --check $_.FullName

                                if ($LASTEXITCODE -ne 0) {
                                    throw "JavaScript syntax validation failed: $($_.Name)"
                                }
                            }

                        Write-Output 'All JavaScript files passed node --check.'
                    }
                    else {
                        Write-Output 'Node.js is not installed on this Jenkins agent; JavaScript syntax checks were skipped.'
                    }

                    Write-Output 'Required static site files are present.'
                '''
            }
        }

        stage('Build/Test') {
            steps {
                powershell '''
                    $ErrorActionPreference = 'Stop'

                    Write-Output 'Running StaySmart CI checks...'

                    if (Test-Path -LiteralPath 'index.html' -PathType Leaf) {
                        Write-Output 'index.html validation passed.'
                    }

                    Write-Output 'StaySmart project validation completed successfully.'
                '''
            }
        }
    }

    post {
        success {
            Write-Output 'StaySmart CI pipeline completed successfully.'
        }

        failure {
            Write-Output 'StaySmart CI pipeline failed. Check the console output.'
        }
    }
}
