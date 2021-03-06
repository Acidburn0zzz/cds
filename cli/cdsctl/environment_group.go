package main

import (
	"fmt"
	"reflect"
	"regexp"
	"strings"

	"github.com/spf13/cobra"

	"github.com/ovh/cds/cli"
	"github.com/ovh/cds/sdk/exportentities"
)

var (
	environmentGroupCmd = cli.Command{
		Name:  "group",
		Short: "Manage CDS group linked to an environment",
	}

	environmentGroup = cli.NewCommand(environmentGroupCmd, nil,
		[]*cobra.Command{
			cli.NewCommand(environmentGroupImportCmd, environmentGroupImportRun, nil),
		})
)

var environmentGroupImportCmd = cli.Command{
	Name:  "import",
	Short: "Import group linked to a CDS environment",
	Args: []cli.Arg{
		{Name: "project-key"},
		{Name: "environment-name"},
		{Name: "path"},
	},
	Flags: []cli.Flag{
		{
			Name:  "force",
			Usage: "Use force flag to replace groups in your environment",
			IsValid: func(s string) bool {
				if s != "true" && s != "false" {
					return false
				}
				return true
			},
			Default: "false",
			Kind:    reflect.Bool,
		},
	},
}

func environmentGroupImportRun(v cli.Values) error {
	var btes []byte
	var format = "yaml"

	if strings.HasSuffix(v["path"], ".json") {
		format = "json"
	}

	isURL, _ := regexp.MatchString(`http[s]?:\/\/(.*)`, v["path"])
	if isURL {
		var err error
		btes, _, err = exportentities.ReadURL(v["path"], format)
		if err != nil {
			return err
		}
	} else {
		var err error
		btes, _, err = exportentities.ReadFile(v["path"])
		if err != nil {
			return err
		}
	}

	if _, err := client.EnvironmentGroupsImport(v["project-key"], v["environment-name"], btes, format, v.GetBool("force")); err != nil {
		return err
	}
	fmt.Printf("Groups imported in environment %s with success\n", v["environment-name"])

	return nil
}
